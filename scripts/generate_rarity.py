import json, os
from collections import Counter

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "nft-collection", "collection", "metadata")
TOTAL = 10000

# pass 1: kumpulkan semua atribut
per_token = []
trait_names = None
for tid in range(1, TOTAL + 1):
    with open(os.path.join(BASE, str(tid))) as f:
        meta = json.load(f)
    attrs = {a["trait_type"]: a["value"] for a in meta["attributes"]}
    if trait_names is None:
        trait_names = [a["trait_type"] for a in meta["attributes"]]
    per_token.append([attrs.get(t, "") for t in trait_names])

counters = [Counter() for _ in trait_names]
for row in per_token:
    for i, v in enumerate(row):
        counters[i][v] += 1

print("=== statistik trait ===")
for t, c in zip(trait_names, counters):
    print(f"{t}: {len(c)} nilai unik")

# Trait yang dipakai untuk skor: abaikan yang (hampir) unik per token (Character)
# dan yang konstan. Ambang: nilai unik <= 1000.
scored = [i for i, c in enumerate(counters) if 1 < len(c) <= 1000]
print("trait untuk skor:", [trait_names[i] for i in scored])

# skor token: jumlah log(TOTAL/count) atas trait yang diskor
import math
scores = []
for row in per_token:
    s = 0.0
    for i in scored:
        s += math.log(TOTAL / counters[i][row[i]])
    scores.append(s)

order = sorted(range(TOTAL), key=lambda k: -scores[k])
ranks = [0] * TOTAL
for pos, k in enumerate(order):
    ranks[k] = pos + 1

# bangun output ringkas: kamus nilai + indeks per token (semua trait ditampilkan,
# skor dari trait terpilih saja)
values = []
counts = []
token_rows = []
for i, t in enumerate(trait_names):
    vals = sorted(counters[i].keys())
    values.append(vals)
    counts.append([counters[i][v] for v in vals])
    idx = {v: j for j, v in enumerate(vals)}
    for k, row in enumerate(per_token):
        pass
for k, row in enumerate(per_token):
    token_rows.append([values[i].index(row[i]) for i in range(len(trait_names))])

out = {
    "total": TOTAL,
    "traits": trait_names,
    "scoredTraits": [trait_names[i] for i in scored],
    "values": values,
    "counts": counts,
    "tokens": token_rows,
    "ranks": ranks,
}
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "public"), exist_ok=True)
dest = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "public", "rarity.json")
with open(dest, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("rarity.json:", round(os.path.getsize(dest) / 1024), "KB")
print("contoh token 1 rank:", ranks[0], "| token 10000 rank:", ranks[TOTAL - 1])
top = order[0] + 1
print("paling langka: token", top, "rank 1")
