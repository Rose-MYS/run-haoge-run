using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

internal static class Launcher
{
    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            string version = assembly.ManifestModule.ModuleVersionId.ToString("N");
            string directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "HaogeRunner", version
            );
            string html = Path.Combine(directory, "game.html");
            using (var install = new Mutex(false, @"Local\HaogeRunner-" + version))
            {
                try { install.WaitOne(); }
                catch (AbandonedMutexException) { }
                try
                {
                    if (!File.Exists(html))
                    {
                        Directory.CreateDirectory(directory);
                        string staging = Path.Combine(directory, Guid.NewGuid().ToString("N") + ".tmp");
                        using (var payload = assembly.GetManifestResourceStream("game.html.gz"))
                        using (var decoded = new GZipStream(payload, CompressionMode.Decompress))
                        using (var output = new FileStream(staging, FileMode.CreateNew))
                        {
                            decoded.CopyTo(output);
                        }
                        File.Move(staging, html);
                    }
                }
                finally { install.ReleaseMutex(); }
            }
            if (args.Length == 1 && args[0] == "--extract-only") return 0;
            Process.Start(new ProcessStartInfo(html) { UseShellExecute = true });
            return 0;
        }
        catch (Exception error)
        {
            if (args.Length == 0)
                MessageBox.Show(error.Message, "郝哥快跑启动失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
