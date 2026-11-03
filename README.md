# mekkatips-reels
Renderiza reels 9:16 de MekkaTips con GitHub Actions (workflow `render-reel`, disparado desde n8n).
Entrada: JSON `{hook_big, hook_sub, total_label, picks:[{tag,pick,odds,units}]}` (max 3 picks). Salida: `reel.mp4` en un Release.
Probar el render local: crear `data.json`, `npm i playwright`, `node render/render.js`.
