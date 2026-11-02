#!/usr/bin/env python3
"""Generate the NPC HOOD 10,000 NFT collection from original pixel-art primitives.

Outputs:
  collection/images/{id}.png   768x768 pixel art
  collection/metadata/{id}     ERC-721/OpenSea-compatible JSON (no extension)
  collection/manifest.csv      trait index
  collection/README.txt        upload and CID instructions
  collection/preview.png       contact sheet of the first 30 items

Example:
  python3 generate_collection.py --count 10000 --seed 20261102
  python3 generate_collection.py --metadata-only --image-base ipfs://<IMAGE_CID>/
"""
from __future__ import annotations
import argparse
import csv
import json
import random
import shutil
import zipfile
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "collection"
BASE = 128
SCALE = 6
SIZE = BASE * SCALE

# Palette families stay close to the website's forest-green / warm-gold identity,
# with a few lore-friendly night, moss, ember and moonlit alternatives.
PALETTES = [
    {"name":"Earthy Green","sky":["#263e38","#52614a","#b87945"],"hood":"#285238","hood_hi":"#527348","robe":"#193d2d","robe_hi":"#376443","accent":"#e5b74e","stone":"#565348"},
    {"name":"Night Olive","sky":["#202b2b","#464639","#9a6e3e"],"hood":"#45472c","hood_hi":"#747448","robe":"#262e28","robe_hi":"#4e523b","accent":"#f0ae43","stone":"#48463d"},
    {"name":"Mosslight","sky":["#31463b","#71835c","#c9965a"],"hood":"#527047","hood_hi":"#829258","robe":"#31543b","robe_hi":"#668253","accent":"#f0c65b","stone":"#6d6850"},
    {"name":"Duskwalker","sky":["#292f40","#59516a","#bf7754"],"hood":"#30483f","hood_hi":"#60735d","robe":"#202d32","robe_hi":"#43524b","accent":"#eeb354","stone":"#595264"},
    {"name":"Ember Alley","sky":["#352d2b","#74513c","#d17b45"],"hood":"#31503a","hood_hi":"#5e7445","robe":"#253a30","robe_hi":"#495b3c","accent":"#ffd16b","stone":"#685140"},
    {"name":"Moonlit Pine","sky":["#182b37","#34495a","#817e78"],"hood":"#244c49","hood_hi":"#477568","robe":"#172e35","robe_hi":"#355354","accent":"#ead18a","stone":"#4b5860"},
    {"name":"Old Gold","sky":["#353432","#74654b","#c68e50"],"hood":"#514832","hood_hi":"#837248","robe":"#34362e","robe_hi":"#60563b","accent":"#f2c85b","stone":"#71634b"},
    {"name":"Rainy Borough","sky":["#24343a","#4b5a56","#9d8062"],"hood":"#31534b","hood_hi":"#5d7965","robe":"#25383a","robe_hi":"#45605b","accent":"#e7bc70","stone":"#505958"},
]
HOODS = ["Wayfarer Hood","Deep Cowl","Leaf-Cut Hood","Lantern Hood","Ranger Hood","Patchwork Hood"]
EYES = ["Quiet Eyes","Amber Eyes","Spectacles","Shadowed Face","Mask of the Lane"]
OUTFITS = ["Town Cloak","Scout Mantle","Keeper Coat","Patchwork Robe","Night Shift","Courier Layers"]
ACCESSORIES = ["No Accessory","Pocket Lantern","Town Key","Folded Map","Lucky Charm","Old Book","Copper Flask","Moon Pin","Wayfinder Staff","Messenger Satchel"]
BACKGROUNDS = ["Town at Dusk","Lantern Street","Old Rooftops","Mossy Gate","Moonlit Lane","Market After Hours"]
SKINS = ["Warm Umber","Soft Sand","Rosewood","Copper","Moon-Pale"]
MARKS = ["Gold Stitch","Leaf Emblem","No Crest","Moon Badge","Town Seal","Silver Thread"]
SKIN_COLORS = {"Warm Umber":"#b8794d","Soft Sand":"#d9aa74","Rosewood":"#a96754","Copper":"#c88750","Moon-Pale":"#d8c6a1"}
INK = "#171d1a"


def hex_rgb(h):
    h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def tint(h, amount=0.15):
    r,g,b=hex_rgb(h)
    return (min(255,int(r+(255-r)*amount)),min(255,int(g+(255-g)*amount)),min(255,int(b+(255-b)*amount)))

def darken(h, amount=0.22):
    r,g,b=hex_rgb(h); return (int(r*(1-amount)),int(g*(1-amount)),int(b*(1-amount)))

def rect(d, box, fill, outline=None, width=1):
    x0,y0,x1,y1=box
    box=(min(x0,x1),min(y0,y1),max(x0,x1),max(y0,y1))
    d.rectangle(box, fill=fill, outline=outline, width=width)

def polygon(d, pts, fill, outline=INK, width=2):
    d.polygon(pts, fill=fill)
    if outline: d.line(pts+[pts[0]], fill=outline, width=width, joint="curve")

def draw_city(d, rng, pal, bg_name):
    c0,c1,c2=map(hex_rgb,pal["sky"])
    # Stepped evening sky, rather than a smooth gradient, for a true pixel-art feel.
    for y in range(BASE):
        t=y/(BASE-1)
        if t < .60:
            q=t/.60; col=tuple(int(c0[k]*(1-q)+c1[k]*q) for k in range(3))
        else:
            q=(t-.60)/.40; col=tuple(int(c1[k]*(1-q)+c2[k]*q) for k in range(3))
        d.line((0,y,BASE,y),fill=col)
    # Stars and blocky clouds.
    for _ in range(15):
        x=rng.randrange(5,123); y=rng.randrange(5,53)
        if rng.random()<.42:
            rect(d,(x,y,x+1,y+1),tint(pal["accent"],.12))
    cloud=tuple(int(x*.58) for x in c1)
    for _ in range(5):
        x=rng.randrange(-12,112); y=rng.randrange(12,47); w=rng.randrange(9,23)
        rect(d,(x,y,x+w,y+2),cloud)
        rect(d,(x+3,y-2,x+w-4,y),cloud)
    # Sun / moon with square corners.
    orb=pal["accent"] if "Moonlit" not in pal["name"] else "#d6d0a2"
    ox=rng.choice([22,103]); oy=rng.randrange(24,43); rad=rng.randrange(4,8)
    rect(d,(ox-rad,oy-rad,ox+rad,oy+rad),tint(orb,.05))
    if rng.random()<.5: rect(d,(ox-rad,oy+rad-2,ox+rad,oy+rad+1),darken(orb,.2))
    # Distant silhouettes.
    far=darken(pal["hood"],.33); near=darken(pal["robe"],.10)
    for i in range(10):
        x=i*14-rng.randrange(5,14); w=rng.randrange(12,22); h=rng.randrange(17,40)
        y=76-h
        rect(d,(x,y,x+w,78),far)
        if rng.random()<.6:
            rect(d,(x+3,y-6,x+6,y),far); rect(d,(x+2,y+7,x+4,y+10),pal["accent"])
        for wy in range(y+9,75,9):
            for wx in range(x+3,x+w-2,7):
                if rng.random()<.18: rect(d,(wx,wy,wx+2,wy+3),pal["accent"])
    # Distinguish each environment through foreground props and terrain.
    if bg_name in ("Lantern Street","Market After Hours"):
        for x in (12,111):
            rect(d,(x,52,x+2,91),darken(pal["stone"],.25))
            rect(d,(x-3,55,x+5,64),INK); rect(d,(x-1,57,x+3,62),pal["accent"])
    if bg_name in ("Old Rooftops","Mossy Gate"):
        for x in (0,101):
            rect(d,(x,69,x+26,102),darken(pal["stone"],.12),INK)
            for yy in range(73,100,8): rect(d,(x+3,yy,x+7,yy+3),pal["accent"] if rng.random()<.35 else darken(pal["stone"],.28))
    if bg_name=="Market After Hours":
        for x,side in ((3,1),(103,-1)):
            rect(d,(x,62,x+22,78),"#76543c",INK,1)
            rect(d,(x-2,59,x+24,64),"#b76c45",INK,1)
            for k in range(4): rect(d,(x+2+k*5,60,x+4+k*5,63),"#e4c27a")
            rect(d,(x+4,68,x+8,72),pal["accent"])
    elif bg_name=="Mossy Gate":
        rect(d,(5,59,10,96),darken(pal["stone"],.12),INK,1)
        rect(d,(112,59,117,96),darken(pal["stone"],.12),INK,1)
        rect(d,(5,56,117,62),darken(pal["stone"],.08),INK,1)
        for x,y in ((15,58),(19,61),(109,57),(104,62),(9,68),(116,72)):
            rect(d,(x,y,x+4,y+3),"#54744c")
    elif bg_name=="Old Rooftops":
        for x in (6,102):
            polygon(d,[(x,71),(x+10,62),(x+21,71)],darken(pal["stone"],.1),INK,1)
            rect(d,(x+3,71,x+18,82),darken(pal["stone"],.08),INK,1)
    elif bg_name=="Town at Dusk":
        rect(d,(14,66,16,81),darken(pal["stone"],.15))
        rect(d,(11,64,19,68),INK); rect(d,(13,65,17,67),pal["accent"])
    # Cobbled ground and a clear pedestal-like path.
    rect(d,(0,82,127,127),darken(pal["stone"],.27))
    for yy in range(83,127,7):
        for xx in range(-5,132,14):
            shift=7 if (yy//7)%2 else 0
            x=xx+shift
            col=pal["stone"] if rng.random()<.72 else tint(pal["stone"],.12)
            rect(d,(x,yy,x+8,yy+3),col)
    if bg_name=="Moonlit Lane":
        for x,y,w in ((13,99,18),(94,108,20),(23,119,13)):
            rect(d,(x,y,x+w,y+2),"#71817a")
            rect(d,(x+3,y,x+w-3,y),"#b8b49a")
    # Fine skyline shadows / frame corners.
    rect(d,(0,0,3,127),darken(pal["robe"],.3)); rect(d,(124,0,127,127),darken(pal["robe"],.3))

def draw_character(d, rng, pal, traits):
    hood=pal["hood"]; hood_hi=pal["hood_hi"]; robe=pal["robe"]; robe_hi=pal["robe_hi"]; gold=pal["accent"]
    skin=SKIN_COLORS[traits["Skin"]]
    # Feet and trousers sit behind the cloak.
    rect(d,(49,91,59,111),darken(robe,.30),INK,2)
    rect(d,(68,91,78,111),darken(robe,.30),INK,2)
    rect(d,(45,108,61,116),"#d6c4a2",INK,2); rect(d,(66,108,83,116),"#d6c4a2",INK,2)
    rect(d,(47,113,60,115),darken(hood,.25)); rect(d,(68,113,81,115),darken(hood,.25))
    rect(d,(49,104,59,107),gold if rng.random()<.35 else darken(robe,.18))
    rect(d,(69,104,77,107),gold if rng.random()<.25 else darken(robe,.18))
    # Outer hood: stepped silhouette and inner shadow.
    if traits["Hood"]=="Deep Cowl":
        outer=[(43,31),(48,20),(60,14),(75,17),(84,28),(88,44),(82,57),(78,64),(47,64),(39,56),(35,45),(37,34)]
    elif traits["Hood"]=="Leaf-Cut Hood":
        outer=[(43,29),(51,18),(61,14),(73,18),(82,29),(85,44),(78,56),(75,63),(50,63),(42,55),(37,43),(39,32)]
    elif traits["Hood"]=="Lantern Hood":
        outer=[(44,26),(54,17),(69,17),(80,26),(86,39),(84,52),(75,63),(49,63),(40,54),(36,41)]
    elif traits["Hood"]=="Ranger Hood":
        outer=[(43,28),(53,17),(68,17),(80,24),(87,37),(84,50),(76,62),(48,63),(39,54),(35,40)]
    elif traits["Hood"]=="Patchwork Hood":
        outer=[(45,29),(51,20),(61,14),(76,19),(83,29),(87,42),(81,55),(77,63),(48,63),(40,55),(36,43)]
    else:
        outer=[(43,30),(50,19),(61,14),(74,17),(83,29),(87,43),(81,56),(76,63),(48,63),(40,56),(36,44)]
    polygon(d,outer,hood,INK,3)
    inner=[(47,31),(53,23),(62,20),(73,22),(80,31),(82,42),(76,51),(71,57),(53,57),(46,51),(42,42)]
    polygon(d,inner,darken(hood,.25),INK,2)
    # Face / mask region.
    face=[(49,34),(55,29),(68,29),(75,35),(75,45),(69,51),(54,51),(48,46),(46,39)]
    polygon(d,face,skin,INK,1)
    # Side hair / shadow and eye variations.
    rect(d,(47,35,51,44),darken(skin,.28)); rect(d,(71,33,74,42),darken(skin,.15))
    eye=INK if traits["Eyes"]!="Amber Eyes" else "#a15e28"
    if traits["Eyes"]=="Shadowed Face":
        rect(d,(51,37,71,41),darken(skin,.52)); rect(d,(54,39,57,40),gold)
    elif traits["Eyes"]=="Mask of the Lane":
        rect(d,(49,36,73,42),darken(robe,.08)); rect(d,(53,38,57,40),gold); rect(d,(66,38,70,40),gold)
    elif traits["Eyes"]=="Spectacles":
        rect(d,(50,35,60,43),gold,INK,1); rect(d,(64,35,74,43),gold,INK,1)
        rect(d,(52,37,58,41),"#c8b481"); rect(d,(66,37,72,41),"#c8b481"); rect(d,(60,38,64,39),INK)
    else:
        rect(d,(53,37,57,40),eye); rect(d,(67,37,71,40),eye)
        rect(d,(54,37,55,38),"#f6d27a"); rect(d,(68,37,69,38),"#f6d27a")
    rect(d,(60,43,63,44),darken(skin,.24))
    # Cloak and sleeves.
    body=[(47,55),(55,51),(68,52),(77,58),(83,72),(86,94),(79,103),(46,103),(38,96),(40,73)]
    polygon(d,body,robe,INK,3)
    # Angular mantle panels, highlights, cuffs.
    polygon(d,[(48,57),(55,54),(58,83),(50,96),(43,91),(44,70)],robe_hi,None)
    polygon(d,[(70,56),(77,61),(81,77),(80,93),(75,98),(69,84)],hood_hi,None)
    rect(d,(55,57,69,91),darken(robe,.12),INK,1)
    rect(d,(60,57,64,93),darken(robe,.18))
    rect(d,(58,62,67,64),gold); rect(d,(59,67,66,69),gold)
    outfit=traits["Outfit"]
    if outfit=="Scout Mantle":
        polygon(d,[(45,59),(54,54),(62,61),(71,54),(80,61),(74,70),(62,66),(50,70)],hood_hi,INK,1)
        rect(d,(60,62,64,65),gold)
    elif outfit=="Keeper Coat":
        rect(d,(50,77,57,86),darken(robe,.2),gold,1); rect(d,(68,77,75,86),darken(robe,.2),gold,1)
        rect(d,(61,72,63,73),gold); rect(d,(61,78,63,79),gold)
    elif outfit=="Patchwork Robe":
        rect(d,(47,74,53,80),"#a46f4d",INK,1); rect(d,(71,83,77,89),"#b7a06a",INK,1)
        rect(d,(48,82,51,84),gold); rect(d,(72,85,75,87),hood)
    elif outfit=="Night Shift":
        polygon(d,[(50,54),(56,51),(62,59),(69,51),(75,55),(69,67),(62,63),(56,68)],darken(robe,.35),INK,1)
        rect(d,(52,88,55,93),"#bfc4b3"); rect(d,(72,89,75,94),"#bfc4b3")
    elif outfit=="Courier Layers":
        polygon(d,[(51,57),(55,56),(72,87),(69,90)],"#aa7950",INK,1)
        rect(d,(56,85,70,88),gold); rect(d,(61,84,65,89),"#51412e")
    # Hands and sleeves.
    polygon(d,[(39,66),(47,62),(53,69),(48,81),(40,80)],robe_hi,INK,2)
    polygon(d,[(74,62),(82,66),(84,79),(77,83),(70,74)],robe_hi,INK,2)
    rect(d,(39,78,46,83),skin,INK,1); rect(d,(77,79,84,84),skin,INK,1)
    # Randomly selected insignia / seams.
    mark=traits["Mark"]
    if mark=="Gold Stitch":
        rect(d,(47,71,50,82),gold); rect(d,(49,79,53,82),gold)
    elif mark=="Leaf Emblem":
        polygon(d,[(47,73),(52,69),(55,73),(52,79),(48,78)],"#789251",INK,1)
    elif mark=="Moon Badge":
        rect(d,(73,72,80,79),gold,INK,1); rect(d,(76,72,80,77),robe)
    elif mark=="Town Seal":
        rect(d,(48,69,54,76),"#c9b47a",INK,1); rect(d,(50,71,52,74),robe)
    elif mark=="Silver Thread":
        rect(d,(45,68,47,87),"#bdc4b6"); rect(d,(47,84,52,86),"#bdc4b6")
    # Choice of accessory, drawn in the character's hand / beside the body.
    acc=traits["Accessory"]
    if acc=="Pocket Lantern":
        rect(d,(81,68,89,80),INK,2); rect(d,(83,71,87,77),gold); rect(d,(84,65,86,68),gold)
    elif acc=="Town Key":
        rect(d,(83,68,85,84),gold); rect(d,(79,67,87,70),gold); rect(d,(84,80,89,82),gold)
    elif acc=="Folded Map":
        polygon(d,[(79,69),(84,67),(89,70),(89,81),(84,79),(79,82)],"#d4c396",INK,1)
        rect(d,(83,69,84,79),darken(hood,.25))
    elif acc=="Lucky Charm":
        rect(d,(83,68,89,74),gold,INK,1); rect(d,(84,70,88,72),"#a55a43")
    elif acc=="Old Book":
        rect(d,(80,70,89,81),"#9d6540",INK,2); rect(d,(82,72,87,79),"#d8c79a"); rect(d,(83,73,86,74),hood)
    elif acc=="Copper Flask":
        rect(d,(82,71,89,81),"#b87445",INK,2); rect(d,(84,67,87,71),gold)
    elif acc=="Moon Pin":
        rect(d,(78,68,84,74),"#d7d1a1",INK,1); rect(d,(80,68,84,72),hood)
    elif acc=="Wayfinder Staff":
        rect(d,(88,55,90,101),"#78583b",INK,1); rect(d,(85,53,93,57),gold)
    elif acc=="Messenger Satchel":
        rect(d,(40,72,48,86),"#8a6242",INK,2); rect(d,(42,75,46,77),gold)
    # Hood's signature stitch or leaf notch.
    if traits["Hood"] in ("Leaf-Cut Hood","Patchwork Hood"):
        polygon(d,[(41,31),(34,27),(38,39)],hood_hi,INK,1)
    # Tiny pixel reflection on cloak for extra depth.
    for _ in range(6):
        x=rng.randrange(43,79); y=rng.randrange(59,96)
        if rng.random()<.5: rect(d,(x,y,x+1,y+1),tint(robe_hi,.1))
    # Full token art scaled with nearest-neighbour to preserve sharp pixel clusters.

def make_traits(rng):
    return {
        "Palette": rng.choice(PALETTES)["name"],
        "Hood": rng.choice(HOODS),
        "Eyes": rng.choice(EYES),
        "Outfit": rng.choice(OUTFITS),
        "Accessory": rng.choice(ACCESSORIES),
        "Setting": rng.choice(BACKGROUNDS),
        "Skin": rng.choice(SKINS),
        "Mark": rng.choice(MARKS),
    }

def make_image(token_id, traits, seed):
    rng=random.Random(seed ^ (token_id * 0x9E3779B1))
    pal=next(p for p in PALETTES if p["name"]==traits["Palette"])
    im=Image.new("RGB",(BASE,BASE),(0,0,0)); d=ImageDraw.Draw(im)
    draw_city(d,rng,pal,traits["Setting"])
    draw_character(d,rng,pal,traits)
    # Small inset frame echoes the site's framed hero artwork.
    rect(d,(4,4,123,123),None,pal["accent"],1)
    # Pixel-corner ticks.
    for x,y,sx,sy in [(6,6,1,1),(121,6,-1,1),(6,121,1,-1),(121,121,-1,-1)]:
        rect(d,(x,y,x+3*sx,y+1*sy),pal["accent"])
        rect(d,(x,y,x+1*sx,y+3*sy),pal["accent"])
    im=im.resize((SIZE,SIZE),Image.Resampling.NEAREST)
    return im

def pick_unique_traits(rng, count):
    seen=set(); rows=[]
    while len(rows)<count:
        t=make_traits(rng); key=tuple(t.values())
        if key in seen: continue
        seen.add(key); rows.append(t)
    return rows

def name_for(i, traits):
    epithet={"Pocket Lantern":"Lanternbearer","Town Key":"Keykeeper","Folded Map":"Wayfinder","Lucky Charm":"Fortune-Keeper","Old Book":"Lorekeeper","Copper Flask":"Night Drifter","Moon Pin":"Moonstruck","Wayfinder Staff":"Pathfinder","Messenger Satchel":"Courier","No Accessory":"Quiet Watcher"}[traits["Accessory"]]
    return f"NPC HOOD #{i:04d} — {epithet}"

def build_metadata(count, image_base):
    OUT.mkdir(parents=True,exist_ok=True)
    meta_dir=OUT/"metadata"; meta_dir.mkdir(parents=True,exist_ok=True)
    rows=[]
    for i in range(1,count+1):
        p=meta_dir/str(i)
        if not p.exists(): continue
        data=json.loads(p.read_text())
        data["image"]=image_base.rstrip("/")+f"/{i}.png"
        p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
        rows.append(data)
    return rows

def create_readme(count, image_base):
    text=f'''NPC HOOD — {count:,} NFT COLLECTION\n\nOriginal generated pixel-art inspired by the NPC HOOD website's hooded town-character theme.\n\nCONTENTS\n- images/ : {count:,} PNG files, 768 × 768 pixels\n- metadata/ : {count:,} ERC-721 metadata JSON files named 1 through {count} (no extension)\n- manifest.csv : token IDs and traits\n- preview.png : visual preview only; not an NFT asset\n\nUPLOAD FOR THE CONTRACT\n1. Upload the images/ folder to IPFS (or another permanent HTTPS host).\n2. Run the generator with --metadata-only --image-base ipfs://<IMAGE_FOLDER_CID>/ to set image URIs.\n3. Upload the metadata/ folder to IPFS. Filenames intentionally have no extension, matching the NPC HOOD contract's tokenURI (base URI + token ID).\n4. Use the metadata-folder URI ending in / as the contract Base URI, for example ipfs://<METADATA_FOLDER_CID>/.\n5. Test token IDs 1 and {count} in a wallet/marketplace before opening mint.\n\nCURRENT IMAGE URI PREFIX\n{image_base}\n\nIMPORTANT\n- Image and metadata folders are separate so image URIs can reference their own IPFS directory CID.\n- Replace the example image CID before publishing. Never point a live contract at a temporary/local folder.\n- This archive does not deploy a contract, upload to IPFS, or open mint.\n- Images were generated from procedural primitives and trait combinations; the script and seed make the collection reproducible.\n'''
    (OUT/"README.txt").write_text(text)

def create_preview(count):
    files=sorted((OUT/"images").glob("*.png"),key=lambda p:int(p.stem))[:30]
    cell=168; cols=5; rows=(len(files)+cols-1)//cols
    board=Image.new("RGB",(cols*cell,rows*(cell+24)),"#e9e4d7")
    d=ImageDraw.Draw(board)
    for ix,p in enumerate(files):
        img=Image.open(p).resize((cell-12,cell-12),Image.Resampling.NEAREST)
        x=(ix%cols)*cell+6; y=(ix//cols)*(cell+24)+4
        board.paste(img,(x,y)); d.text((x,y+cell-7),f"NPC HOOD #{int(p.stem):04d}",fill="#1c3d2b")
    board.save(OUT/"preview.png",optimize=True)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--count",type=int,default=10000)
    ap.add_argument("--seed",type=int,default=20261102)
    ap.add_argument("--image-base",default="ipfs://REPLACE_WITH_IMAGES_CID")
    ap.add_argument("--metadata-only",action="store_true",help="rewrite image URIs in existing metadata only")
    ap.add_argument("--no-zip",action="store_true")
    args=ap.parse_args()
    if not (1<=args.count<=10000): raise SystemExit("--count must be between 1 and 10000")
    OUT.mkdir(parents=True,exist_ok=True)
    if args.metadata_only:
        build_metadata(args.count,args.image_base)
        create_readme(args.count,args.image_base)
        print(f"Updated {args.count} metadata image URIs in {OUT/'metadata'}")
        return
    img_dir=OUT/"images"; meta_dir=OUT/"metadata"
    img_dir.mkdir(parents=True,exist_ok=True); meta_dir.mkdir(parents=True,exist_ok=True)
    rng=random.Random(args.seed)
    designs=pick_unique_traits(rng,args.count)
    trait_counts={k:Counter() for k in designs[0]}
    with (OUT/"manifest.csv").open("w",newline="",encoding="utf-8") as f:
        writer=csv.writer(f); writer.writerow(["token_id","name",*designs[0].keys()])
        for i,t in enumerate(designs,1):
            for k,v in t.items(): trait_counts[k][v]+=1
            image=make_image(i,t,args.seed)
            image.save(img_dir/f"{i}.png",format="PNG",optimize=True)
            metadata={
                "name":name_for(i,t),
                "description":"A hooded little pixel character from the NPC HOOD universe. A quiet soul of the town at dusk, drawn in a classic limited-palette pixel-art style.",
                "image":args.image_base.rstrip("/")+f"/{i}.png",
                "external_url":"https://npcshood.xyz/",
                "attributes":[
                    {"trait_type":"Character","value":name_for(i,t).split("— ",1)[-1]},
                    {"trait_type":"Hood","value":t["Hood"]},
                    {"trait_type":"Eyes","value":t["Eyes"]},
                    {"trait_type":"Outfit","value":t["Outfit"]},
                    {"trait_type":"Accessory","value":t["Accessory"]},
                    {"trait_type":"Setting","value":t["Setting"]},
                    {"trait_type":"Palette","value":t["Palette"]},
                    {"trait_type":"Skin","value":t["Skin"]},
                    {"trait_type":"Mark","value":t["Mark"]},
                    {"trait_type":"Art Style","value":"Pixel Art"},
                ]
            }
            (meta_dir/str(i)).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n")
            writer.writerow([i,name_for(i,t),*t.values()])
            if i%500==0: print(f"Rendered {i:,}/{args.count:,}",flush=True)
    create_readme(args.count,args.image_base)
    create_preview(args.count)
    if not args.no_zip:
        archive=ROOT/f"NPC_HOOD_{args.count}_NFTs.zip"
        with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=3,allowZip64=True) as z:
            for p in sorted(OUT.rglob("*")):
                if p.is_file(): z.write(p,p.relative_to(OUT.parent))
        print(f"Archive ready: {archive} ({archive.stat().st_size/1024/1024:.1f} MiB)")
    print(f"Collection: {OUT}")
    print(f"Unique trait combinations: {len(set(tuple(t.values()) for t in designs)):,}")

if __name__=="__main__": main()
