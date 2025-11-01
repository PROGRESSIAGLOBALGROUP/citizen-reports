# Copilot Instructions Update - October 9, 2025

## Summary of Changes

Updated `.github/copilot-instructions.md` to reflect the current state of the codebase after recent critical bugfixes.

## Key Updates Made

### 1. **Last Updated Date**
- Changed from "October 2025" to "October 9, 2025"
- Added specific mention of recent bugfixes: admin panel token auth, tipos edición crashes

### 2. **Critical Authentication Token Key**
- **Added:** Explicit warnings throughout document about using `auth_token` NOT `token`
- **Location:** Quick Start, Common Scenarios, Common Pitfalls
- **Reason:** October 8 bugfix revealed frontend was using wrong localStorage key

### 3. **Database Schema Column Names**
- **Added:** Warning about `tipos_reporte` table using column `tipo` NOT `slug`
- **Location:** Database Access Layer section, Common Errors table
- **Reason:** October 8 bugfix revealed admin routes were using non-existent `slug` column

### 4. **Recent Critical Bugfixes Section**
- **Added:** New section documenting three major October 2025 bugfixes:
  1. Admin Panel Type Editing Crash (Oct 8) - token key + schema column issues
  2. Interdepartmental Closure Bug (Oct 5) - wrong dependencia reference
  3. Payload Size Limit (Oct 4) - 1MB→5MB increase for signatures+photos
- **Format:** Problem → Root Cause → Lessons Learned
- **Purpose:** Prevent agents from repeating same mistakes

### 5. **Common Errors Table Enhancements**
- **Added rows:**
  - `401 Unauthorized` on admin endpoints → use `auth_token` key
  - `table tipos_reporte has no column named slug` → use `tipo` column
- **Updated:** Replaced generic "403 Forbidden" with specific admin auth error

### 6. **Common Pitfalls Section**
- **Added DON'Ts:**
  - Use `localStorage.getItem('token')` - correct key is `auth_token`
  - Use `slug` column for tipos_reporte - correct column is `tipo`
- **Added DOs:**
  - Always verify localStorage token key is `auth_token`
  - Check `server/schema.sql` for correct column names before writing SQL

### 7. **JSON Body Limit Documentation**
- **Added:** Note about 5MB limit (increased from 1MB) in API Validation section
- **Reason:** Support for signatures (30KB) + 3 photo evidences (900KB) in closure workflow

### 8. **PowerShell Scripts Clarification**
- **Added:** Detail that `stop-servers.ps1` kills node processes by port
- **Added:** Detail that `start-dev.ps1` opens persistent windows

## Verification Steps Taken

1. ✅ Checked all frontend files use `localStorage.getItem('auth_token')` (20+ occurrences confirmed)
2. ✅ Verified `server/schema.sql` defines `tipo` column, not `slug`
3. ✅ Confirmed recent bugfix documentation exists in `docs/BUGFIX_*.md`
4. ✅ Validated changelog entries match described fixes
5. ✅ Cross-referenced ADR-0009 and ADR-0010 for architectural context

## Files Analyzed

- `.github/copilot-instructions.md` (791 lines)
- `README.md` (290 lines)
- `docs/changelog.md`
- `docs/BUGFIX_EDICION_TIPOS_CRASH_2025-10-08.md` (236 lines)
- `docs/adr/ADR-0009-gestion-tipos-categorias-dinamicas.md`
- `server/app.js` (395 lines)
- `server/auth_middleware.js` (242 lines)
- `client/src/App.jsx` (395 lines)
- `tests/backend/reportes.test.js` (151 lines)
- Multiple frontend components for token key verification

## Impact on AI Agents

These updates will help AI coding agents:

1. **Avoid repeating October 2025 bugs** - explicit documentation of root causes
2. **Use correct localStorage keys** - prevent 401 errors on admin endpoints
3. **Write correct SQL** - reference actual schema column names
4. **Understand payload constraints** - design for 5MB limit with photos/signatures
5. **Follow interdepartmental patterns** - use `req.usuario.dependencia` correctly

## Next Steps for Agents

When working with this codebase:

1. **Before adding auth:** Check "Common Scenarios" → "I need to add authentication to an endpoint"
2. **Before schema changes:** Read "Common Scenarios" → "I need to modify database schema"
3. **After seeing errors:** Check "Recent Critical Bugfixes" and "Common Errors & Solutions"
4. **Before editing admin panel:** Review October 8, 2025 bugfix lessons
5. **Before interdepartmental features:** Review October 5, 2025 bugfix lessons

## Validation

To verify the instructions are accurate:

```powershell
# 1. Check token key usage
grep -r "localStorage.getItem" client/src/ | grep -v "auth_token"
# Should return only comments or non-token usage

# 2. Verify schema columns
sqlite3 server/data.db ".schema tipos_reporte"
# Should show 'tipo TEXT' not 'slug'

# 3. Test server startup
.\start-dev.ps1
# Both servers should start successfully

# 4. Run all tests
npm run test:all
# All tests should pass
```

## Document Maintenance

This update follows the pattern from the existing copilot instructions:

- ✅ Actionable, specific guidance (not generic advice)
- ✅ Real code examples from the codebase
- ✅ Decision trees for common scenarios
- ✅ Links to detailed documentation
- ✅ Error messages with solutions
- ✅ Anti-patterns to avoid

Updated by: GitHub Copilot AI Agent  
Date: October 9, 2025  
Reviewed: Codebase validation completed successfully
