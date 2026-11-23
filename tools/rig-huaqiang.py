"""Bind a reviewed, subdivided role mesh to the game's Meshy7 skeleton."""

import argparse
from copy import deepcopy
import json
from pathlib import Path
import struct

import numpy as np


ROOT = Path(__file__).resolve().parents[1]


def load_glb(path):
    data = path.read_bytes()
    magic, version, length, json_length, kind = struct.unpack_from("<4sIII4s", data)
    if (magic, version, length, kind) != (b"glTF", 2, len(data), b"JSON"):
        raise ValueError(f"Invalid GLB: {path}")
    return json.loads(data[20:20 + json_length]), data[28 + json_length:]


def array(glb, index):
    doc, data = glb
    accessor = doc["accessors"][index]
    view = doc["bufferViews"][accessor["bufferView"]]
    kind = np.dtype({5121: "u1", 5123: "<u2", 5125: "<u4", 5126: "<f4"}[accessor["componentType"]])
    cols = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}[accessor["type"]]
    return np.ndarray(
        (accessor["count"], cols), kind, data,
        view.get("byteOffset", 0) + accessor.get("byteOffset", 0),
        (view.get("byteStride", cols * kind.itemsize), kind.itemsize),
    )


def transfer_weights(source, donor, head_index, joint_count, neck_start):
    source_prim = source[0]["meshes"][0]["primitives"][0]
    donor_attrs = donor[0]["meshes"][0]["primitives"][0]["attributes"]
    triangles = array(source, source_prim["indices"]).reshape(-1, 4, 3)
    first, second, third, center = triangles.transpose(1, 0, 2)
    originals = np.stack((first[:, 0], second[:, 1], third[:, 2]), axis=1)
    if originals.max() >= center.min() or not np.array_equal(first[:, 1], center[:, 0]):
        raise ValueError("The approved mesh must use the original midpoint subdivision.")
    count = int(center.min())
    uv = array(source, source_prim["attributes"]["TEXCOORD_0"])
    points = array(source, source_prim["attributes"]["POSITION"])
    donor_uv = array(donor, donor_attrs["TEXCOORD_0"])
    donor_points = array(donor, donor_attrs["POSITION"])
    donor_joints = array(donor, donor_attrs["JOINTS_0"])
    donor_weights = array(donor, donor_attrs["WEIGHTS_0"])

    assigned = np.empty(count, dtype=np.intp)
    donor_metric = donor_points * .01
    for offset in range(0, count, 128):
        batch = slice(offset, min(offset + 128, count))
        uv_error = ((uv[batch, None] - donor_uv) ** 2).sum(axis=2)
        spatial_error = ((points[batch, None] - donor_metric) ** 2).sum(axis=2)
        assigned[batch] = np.argmin(uv_error + 1e-5 * spatial_error, axis=1)
    if np.quantile(np.linalg.norm(uv[:count] - donor_uv[assigned], axis=1), .995) > .001:
        raise ValueError("The donor rig does not match the approved mesh UVs.")

    weights = np.zeros((len(uv), joint_count), dtype=np.float32)
    rows = np.broadcast_to(np.arange(count)[:, None], donor_joints[assigned].shape)
    np.add.at(weights, (rows, donor_joints[assigned]), donor_weights[assigned])
    for edge in range(3):
        weights[center[:, edge]] = (
            weights[originals[:, edge]] + weights[originals[:, (edge + 1) % 3]]
        ) * .5
    if np.any(weights.sum(axis=1) < .99):
        raise ValueError("A vertex is missing valid skin weights.")

    # Keep vertices at UV seams together. The cranium and face move as one,
    # with a narrow falloff through the neck to preserve the approved sculpt.
    _, groups, totals = np.unique(np.rint(points * 1e5).astype(np.int32), axis=0,
                                   return_inverse=True, return_counts=True)
    welded = np.zeros((len(totals), joint_count), dtype=np.float32)
    np.add.at(welded, groups, weights)
    weights = welded[groups] / totals[groups, None]
    rigid = np.clip((points[:, 1] - neck_start) / .061, 0, 1)
    rigid = rigid * rigid * (3 - 2 * rigid)
    weights *= 1 - rigid[:, None]
    weights[:, head_index] += rigid
    joints = np.argsort(-weights, axis=1)[:, :4]
    values = np.take_along_axis(weights, joints, axis=1)
    values /= values.sum(axis=1, keepdims=True)
    return points, joints.astype("u1"), values.astype("<f4")


def make_rig(source, donor, output, character="huaqiang"):
    doc = deepcopy(source[0])
    raw = bytearray(source[1][:doc["buffers"][0]["byteLength"]])
    rig = donor[0]
    doc["nodes"] = deepcopy(rig["nodes"])
    doc["scenes"] = deepcopy(rig["scenes"])
    doc["skins"] = deepcopy(rig["skins"])
    names = [doc["nodes"][index]["name"] for index in doc["skins"][0]["joints"]]
    haoge = character == "haoge"
    points, joints, weights = transfer_weights(
        source, donor, names.index("Head"), len(names), 1.45 if haoge else 1.512
    )

    def append(data, target=None):
        raw.extend(b"\0" * (-len(raw) % 4))
        view = {"buffer": 0, "byteOffset": len(raw), "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        raw.extend(data)
        doc["bufferViews"].append(view)
        return len(doc["bufferViews"]) - 1

    def add_attribute(data, component_type, kind, **metadata):
        index = len(doc["accessors"])
        view = append(data.tobytes(), 34962)
        doc["accessors"].append(dict(bufferView=view, componentType=component_type, type=kind,
                                     count=len(data), **metadata))
        return index

    attributes = doc["meshes"][0]["primitives"][0]["attributes"]
    armature = doc["nodes"][doc["scenes"][0]["nodes"][0]]
    # Flatten the donor's centimetre rig into metres. Otherwise Three binds
    # unscaled mesh coordinates to world-space inverse bind matrices.
    unit, y_unit, z_unit = armature.pop("scale")
    if unit != y_unit or unit != z_unit:
        raise ValueError("Expected a uniform armature scale.")
    for node in doc["nodes"]:
        if "translation" in node:
            node["translation"] = [axis * unit for axis in node["translation"]]
    attributes["JOINTS_0"] = add_attribute(joints, 5121, "VEC4")
    attributes["WEIGHTS_0"] = add_attribute(weights, 5126, "VEC4")
    mesh_node = next(node for node in doc["nodes"] if "mesh" in node)
    mesh_node["name"] = "HaogeReviewed" if haoge else "Huaqiang"

    if not haoge:
        # Lift one corner only for the existing ending's smirk animation.
        x, y, z = points.T
        lift = np.exp(-((x - .017) / .022) ** 2 - ((y - 1.621) / .019) ** 2)
        lift *= np.clip((z - .047) / .033, 0, 1)
        smirk = np.zeros_like(points)
        smirk[:, 0] = lift * .002
        smirk[:, 1] = lift * .0048
        target = add_attribute(smirk, 5126, "VEC3", min=smirk.min(0).tolist(), max=smirk.max(0).tolist())
        doc["meshes"][0]["primitives"][0]["targets"] = [{"POSITION": target}]
        doc["meshes"][0]["weights"] = [0]
        doc["meshes"][0].setdefault("extras", {})["targetNames"] = ["smirk"]

    def copy_accessor(index, converted=None):
        accessor = deepcopy(rig["accessors"][index])
        view = rig["bufferViews"][accessor["bufferView"]]
        offset = view.get("byteOffset", 0)
        if converted is None:
            data = donor[1][offset:offset + view["byteLength"]]
        else:
            data = converted.tobytes()
            accessor.pop("byteOffset", None)
            if "min" in accessor:
                accessor["min"] = converted.min(axis=0).tolist()
            if "max" in accessor:
                accessor["max"] = converted.max(axis=0).tolist()
        accessor["bufferView"] = append(data)
        doc["accessors"].append(accessor)
        return len(doc["accessors"]) - 1

    skin = doc["skins"][0]
    inverse_index = skin["inverseBindMatrices"]
    inverses = array(donor, inverse_index).copy()
    # Convert the output of each inverse bind (bone-local coordinates)
    # from centimetres to metres, including the inverse translation.
    inverses.reshape(-1, 4, 4)[..., :3] *= unit
    skin["inverseBindMatrices"] = copy_accessor(inverse_index, inverses)
    clips = deepcopy(rig["animations"] if haoge else [next(
        clip for clip in rig["animations"] if clip["name"] == "run"
    )])
    accessors = {}
    for clip in clips:
        moving = {channel["sampler"] for channel in clip["channels"]
                  if channel["target"]["path"] == "translation"}
        for sampler_id, sampler in enumerate(clip["samplers"]):
            for key in ("input", "output"):
                index = sampler[key]
                convert = key == "output" and sampler_id in moving
                lookup = (index, convert)
                if lookup not in accessors:
                    values = array(donor, index) * np.float32(unit) if convert else None
                    accessors[lookup] = copy_accessor(index, values)
                sampler[key] = accessors[lookup]
    doc["animations"] = clips
    doc["scenes"][0]["name"] = "HaogeRig" if haoge else "HuaqiangRig"
    raw.extend(b"\0" * (-len(raw) % 4))
    doc["buffers"][0]["byteLength"] = len(raw)
    header = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    header += b" " * (-len(header) % 4)
    with output.open("xb") as out:
        out.write(struct.pack("<4sIII4s", b"glTF", 2, 28 + len(header) + len(raw),
                              len(header), b"JSON"))
        out.write(header)
        out.write(struct.pack("<I4s", len(raw), b"BIN\0"))
        out.write(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("approved", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--character", choices=("haoge", "huaqiang"), default="huaqiang")
    args = parser.parse_args()
    donor = ROOT / "assets/models/haoge-meshy7-fixed.glb"
    make_rig(load_glb(args.approved), load_glb(donor), args.output, args.character)


if __name__ == "__main__":
    main()
