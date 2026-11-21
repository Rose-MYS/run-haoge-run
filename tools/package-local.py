"""Package a self-contained HTML build for local Windows and Android testing."""

import argparse
import gzip
import os
import pathlib
import secrets
import shutil
import subprocess
import tempfile
import zipfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ROOT / "tools" / "packaging"


def run(*command, env=None):
    subprocess.run(command, check=True, env=env)


def build_windows(html, work):
    framework = pathlib.Path(os.environ["WINDIR"]) / "Microsoft.NET" / "Framework64" / "v4.0.30319"
    compiler = framework / "csc.exe"
    payload = work / "game.html.gz"
    with html.open("rb") as src, gzip.open(payload, "xb", compresslevel=6) as dst:
        shutil.copyfileobj(src, dst)
    exe = work / "HaogeRunner.exe"
    run(compiler, "/nologo", "/target:winexe", "/r:System.Windows.Forms.dll", "/codepage:65001",
        f"/out:{exe}", f"/resource:{payload},game.html.gz", SOURCES / "Launcher.cs")
    return exe


def signing_environment(java_bin, signing):
    signing.mkdir(parents=True, exist_ok=True)
    key = signing / "local-debug.p12"
    password_file = signing / "passphrase"
    if not password_file.exists():
        if key.exists():
            raise ValueError(f"Signing passphrase is missing in {signing}")
        with password_file.open("x", encoding="ascii") as file:
            file.write(secrets.token_hex(24))

    env = {**os.environ, "HAOGE_DEBUG_KEY_PASS": password_file.read_text(encoding="ascii").strip()}
    if not key.exists():
        run(java_bin / "keytool.exe", "-genkeypair", "-keystore", key, "-storetype", "PKCS12",
            "-storepass:env", "HAOGE_DEBUG_KEY_PASS", "-alias", "local-test", "-keyalg", "RSA",
            "-keysize", "2048", "-validity", "10000", "-dname", "CN=Haoge Runner Local Debug",
            env=env)
    return key, env


def build_android(html, work, jdk, build_tools, android_jar):
    java_bin = jdk / "bin"
    java = java_bin / "java.exe"
    classes = work / "classes"
    assets = work / "assets"
    classes.mkdir()
    assets.mkdir()
    shutil.copyfile(html, assets / "game.html")

    run(java_bin / "javac.exe", "-encoding", "UTF-8", "--release", "8",
        "-classpath", android_jar, "-d", classes, SOURCES / "MainActivity.java")
    bytecode = work / "bytecode.jar"
    with zipfile.ZipFile(bytecode, "x", zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(classes.rglob("*.class")):
            archive.write(file, file.relative_to(classes).as_posix())
    run(java, "-cp", build_tools / "lib" / "d8.jar", "com.android.tools.r8.D8",
        "--min-api", "26", "--lib", android_jar, "--output", work, bytecode)

    base = work / "base.apk"
    aligned = work / "aligned.apk"
    apk = work / "HaogeRunner.apk"
    run(build_tools / "aapt2.exe", "link", "--manifest", SOURCES / "AndroidManifest.xml",
        "-I", android_jar, "-A", assets, "-o", base,
        "--min-sdk-version", "26", "--target-sdk-version", "34",
        "--version-code", "1", "--version-name", "0.1-local")
    with zipfile.ZipFile(base, "a", zipfile.ZIP_DEFLATED) as archive:
        archive.write(work / "classes.dex", "classes.dex")
    run(build_tools / "zipalign.exe", "4", base, aligned)
    key, env = signing_environment(java_bin, ROOT / "dist" / ".android-signing")
    signer = (java, "-jar", build_tools / "lib" / "apksigner.jar")
    run(*signer, "sign", "--ks", key, "--ks-key-alias", "local-test",
        "--ks-pass", "env:HAOGE_DEBUG_KEY_PASS", "--out", apk, aligned, env=env)
    run(*signer, "verify", "--verbose", apk)
    run(build_tools / "zipalign.exe", "-c", "4", apk)
    return apk


def main():
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="platform", required=True)
    windows = commands.add_parser("windows")
    android = commands.add_parser("android")
    for command in (windows, android):
        command.add_argument("html", type=pathlib.Path)
        command.add_argument("output", type=pathlib.Path)
    android.add_argument("--jdk", type=pathlib.Path, required=True)
    android.add_argument("--build-tools", type=pathlib.Path, required=True)
    android.add_argument("--android-jar", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if not args.html.is_file() or args.html.suffix.lower() != ".html":
        parser.error("Supply an existing single-file HTML build")
    if args.output.exists():
        parser.error("Output already exists. Supply a new name.")

    work = pathlib.Path(tempfile.mkdtemp(prefix=f"haoge-{args.platform}-"))
    if args.platform == "windows":
        build = build_windows(args.html, work)
    else:
        build = build_android(args.html, work, args.jdk, args.build_tools, args.android_jar)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with build.open("rb") as src, args.output.open("xb") as dst:
        shutil.copyfileobj(src, dst)
    print(f"{args.output}: {args.output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
