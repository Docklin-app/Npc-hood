NPC HOOD — 10,000 NFT COLLECTION

Original generated pixel-art inspired by the NPC HOOD website's hooded town-character theme.

CONTENTS
- images/ : 10,000 PNG files, 768 × 768 pixels
- metadata/ : 10,000 ERC-721 metadata JSON files named 1 through 10000 (no extension)
- manifest.csv : token IDs and traits
- preview.png : visual preview only; not an NFT asset

UPLOAD FOR THE CONTRACT
1. Upload the images/ folder to IPFS (or another permanent HTTPS host).
2. Run the generator with --metadata-only --image-base ipfs://<IMAGE_FOLDER_CID>/ to set image URIs.
3. Upload the metadata/ folder to IPFS. Filenames intentionally have no extension, matching the NPC HOOD contract's tokenURI (base URI + token ID).
4. Use the metadata-folder URI ending in / as the contract Base URI, for example ipfs://<METADATA_FOLDER_CID>/.
5. Test token IDs 1 and 10000 in a wallet/marketplace before opening mint.

CURRENT IMAGE URI PREFIX
https://raw.githubusercontent.com/Docklin-app/Npc-hood/50ec59243a7479bc69249331c39daeedb83405c3/nft-collection/collection/images

IMPORTANT
- Image and metadata folders are separate so image URIs can reference their own IPFS directory CID.
- Replace the example image CID before publishing. Never point a live contract at a temporary/local folder.
- This archive does not deploy a contract, upload to IPFS, or open mint.
- Images were generated from procedural primitives and trait combinations; the script and seed make the collection reproducible.

CURRENT HOSTING MODE
The 10,000 metadata files currently point to public HTTPS image URLs pinned to asset commit 50ec59243a7479bc69249331c39daeedb83405c3. This is GitHub Raw hosting, not IPFS; there is no IPFS CID. The metadata Base URI on the public main branch is:
https://raw.githubusercontent.com/Docklin-app/Npc-hood/main/nft-collection/collection/metadata/
GitHub Raw is centralized hosting and can be subject to service availability or repository changes. To migrate to IPFS, pin both folders and regenerate metadata with --image-base ipfs://<IMAGE_CID>/.
