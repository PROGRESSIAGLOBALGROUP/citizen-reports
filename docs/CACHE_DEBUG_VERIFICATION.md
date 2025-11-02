# Cache Debug - Verify Headers

## Quick Check in Browser Console

```javascript
// Run in browser DevTools console (F12) at http://145.79.0.77:4000

fetch(window.location.href, { method: 'HEAD' })
  .then(r => {
    console.log('📋 Cache-Control:', r.headers.get('Cache-Control'));
    console.log('📋 Pragma:', r.headers.get('Pragma'));
    console.log('📋 Expires:', r.headers.get('Expires'));
    console.log('✅ If you see "no-cache, no-store, must-revalidate", fix is working!');
  });
```

## Expected Output (After Fix)

```
📋 Cache-Control: no-cache, no-store, must-revalidate
📋 Pragma: no-cache
📋 Expires: 0
✅ If you see "no-cache, no-store, must-revalidate", fix is working!
```

## Via PowerShell

```powershell
$headers = (Invoke-WebRequest -Uri "http://145.79.0.77:4000/" -Method Head).Headers
$headers['Cache-Control']
# Should output: no-cache, no-store, must-revalidate
```

## Via curl (on VPS)

```bash
curl -I http://localhost:4000/ | grep -i cache-control
# Should output: Cache-Control: no-cache, no-store, must-revalidate
```

## What This Means

| Header | Value | Meaning |
|--------|-------|---------|
| Cache-Control | no-cache, no-store, must-revalidate | Browser NEVER caches this file |
| Pragma | no-cache | Legacy HTTP/1.0 backward compatibility |
| Expires | 0 | Immediately expired (past date) |

## Result

✅ Every visit to the website fetches the fresh index.html
✅ New deployments are visible immediately (no 1-hour wait)
✅ Asset files (JS/CSS with hashes) are still cached long-term

