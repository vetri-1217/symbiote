# Symbiote Scene - Black Screen Fixed ✅

Original issue: THREE not defined (CDN CORS/file:// block + timing).

Fixes applied:
- [x] Local three.min.js download & HTML link update (no CDN issues)
- [x] scene.js onload wrapper
- [x] Brightened shader/colors/lights/camera (bright purple glossy blob, no fog, closer view, higher exposure/intensity)

Reload http://localhost:8000: Interactive undulating symbiote with mouse displacement, orbit, specular highlights visible. Console clean. Not black anymore!
