# Instagram posting kit — Building 2 "The Alert No One Sent"

- **Handle:** @${handle}
- **Image:** console_photo.png (720x720 — post as-is, do not re-encode or screenshot)
- **Caption:**
  > Relay node console, night of 09/17. Sector went dark an hour after this.
  > check the pixels, not the picture #MANUprotocol #OrangeZone #forensics
- **Alt text:** Diagnostic console with a green status rail and waveform.

## Organizer notes (not for posting)

- This Instagram post is one of the required evidence carriers for CTF-2.
  The others are the pcap and the tower operator log in the portal Evidence tab.
  No single file solves alone.
- Until the real handle is live, the Evidence tab also offers a portal mirror
  download of the same file (`public/data/evidence/relay_node_console_photo.png`).
  When the post goes up, the mirror can be pulled and the card repointed at
  the Instagram URL.
- Image hides ONLY the key fragment `V4ULT` (null-padded): green-channel LSBs
  of every third pixel (x = 2 mod 3), MSB-first, starting in the lower
  diagnostic panel (row 490, x 131). Single-channel tools on the red channel
  or on row 0 recover nothing.
- The fragment is half the XOR key. The other half is the 03:14:08 spike time
  from the tower log (strip the colons, join with an underscore):
  V4ULT_031408.
- pcap: 54 ICMP packets. The 5 exfil fragments ride echo requests
  id=0x7100 seq=21..25 -> 203.0.113.66, acked with `ack`. Ordinary pings
  (id=0x3311/0x4400) go to the gateway, and id=0x6600 pings go to the SAME
  off-net host as harmless noise — only the 0x7100 stream carries base64.
  Concatenate in capture order, base64-decode, XOR with the assembled key.
- Decoy: the `probe_session` cookie on the beacon is flag-shaped, plausible,
  and wrong. The note warns about it explicitly.
- Never re-compress the photo: JPEG/screenshot destroys the LSBs.
