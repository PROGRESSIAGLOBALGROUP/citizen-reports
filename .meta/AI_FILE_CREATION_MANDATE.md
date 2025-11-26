# 🛡️ AI FILE CREATION MANDATE - Protocolo Obligatorio

**Status:** ⚠️ **CRITICAL - MUST FOLLOW**  
**Audience:** GitHub Copilot (Agent Only)  
**Updated:** November 1, 2025

---

## ⚠️ THE PROBLEM

On November 1, 2025, AI Agent created 4 files in root directory:
- ❌ `DEPLOYMENT_SUCCESS_2025-11-01.md`
- ❌ `DEPLOYMENT_SUMMARY.md`
- ❌ `FINAL_STATUS_USER.md`
- ❌ `QUICK_STATUS.md`

**Why is this bad?**
- Violates FILE_STRUCTURE_PROTOCOL.md
- Repeats Oct 31 mistake (11 files in root)
- Shows AI didn't consult governance documents
- Creates technical debt and confusion

**Root Cause:** AI agent created files without consulting protocol first.

---

## ✅ THE SOLUTION: MANDATORY CHECKLIST

**Every time AI Agent wants to create a file, MUST follow this exact sequence:**

### Step 1: IDENTIFY THE FILE
```
Question: "What file am I creating?"
Answer: Name, type, purpose
Example: "DEPLOYMENT_SUMMARY.md - deployment status documentation"
```

### Step 2: CONSULT THE PROTOCOL
```
MUST READ: .meta/FILE_STRUCTURE_PROTOCOL.md
ACTION: Find correct location from protocol table
Example: "Documentation → /docs OR .meta/"
```

### Step 3: VERIFY AGAINST STRUCTURE
```
MUST CHECK: .meta/FILE_STRUCTURE_PROTOCOL.md sections:
- ✅ RAÍZ (Only 5 types allowed)
- ✅ /docs (Master documentation)
- ✅ /scripts (Automation)
- ✅ /server (Backend)
- ✅ /client (Frontend)
- ✅ .meta/ (Governance)

Decision: "Does my file match protocol?"
```

### Step 4: DECIDE LOCATION
```
If YES → Follow protocol location
If NO → Ask user OR revise approach

Example Decision Tree:
├─ "Is this documentation?" 
│  ├─ YES → goes in /docs/
│  └─ NO → continue
├─ "Is this governance?" 
│  ├─ YES → goes in .meta/
│  └─ NO → continue
├─ "Is this automation?" 
│  ├─ YES → goes in /scripts/
│  └─ NO → continue
└─ "Is this core logic?" 
   ├─ YES → goes in /server or /client
   └─ NO → STOP, ask user
```

### Step 5: CREATE FILE (if location confirmed)
```
Use create_file tool with FULL PATH including directory
Example: c:\PROYECTOS\citizen-reports\.meta\FILENAME.md
NOT: c:\PROYECTOS\citizen-reports\FILENAME.md
```

### Step 6: VERIFY AFTER CREATION
```
List files in directory to confirm placement
Confirm file NOT in root (unless protocol allows)
```

---

## 📋 QUICK REFERENCE TABLE

**Before creating ANY file, answer these questions:**

| Question | If YES | If NO |
|----------|--------|-------|
| Is it a README? | Root OK | Continue |
| Is it documentation? | `/docs/` | Continue |
| Is it governance? | `.meta/` | Continue |
| Is it deployment? | `/docs/deployment/` | Continue |
| Is it technical? | `/docs/technical/` | Continue |
| Is it validation? | `/docs/validation/` | Continue |
| Is it script/automation? | `/scripts/` | Continue |
| Is it backend code? | `/server/` | Continue |
| Is it frontend code? | `/client/` | Continue |
| Still not sure? | **STOP - ASK USER** | **NEVER ROOT** |

---

## 🚨 ENFORCEMENT RULES

**If AI Agent violates this mandate:**

❌ Creates file in root without protocol approval
❌ Creates multiple files without checking one by one
❌ Creates file and doesn't verify placement

**Consequence:** User must delete and remind agent to follow mandate.

---

## ✅ CORRECT WORKFLOW (November 1 Example)

**What I should have done:**

```
1. Thinking: "I need to create deployment documentation"
2. Consult: .meta/FILE_STRUCTURE_PROTOCOL.md
3. Decision: "Deployment docs go in .meta/ for this project"
4. Create: c:\PROYECTOS\citizen-reports\.meta\DEPLOYMENT_*.md
5. Verify: "✅ File created in correct location"
```

**What I actually did:**

```
1. Thinking: "I need to create deployment documentation"
2. Action: Created files in root immediately ❌
3. Result: Violated protocol, violated governance
```

---

## 🎯 IMPLEMENTATION

This mandate is now:

✅ **Documented** in this file  
✅ **Included** in copilot-instructions.md  
✅ **Enforced** by user feedback  
✅ **Verified** by manual file listing

---

## 📚 REFERENCE DOCUMENTS

Must read before creating files:
- `.meta/FILE_STRUCTURE_PROTOCOL.md` - Main authority
- `.github/copilot-instructions.md` - Project rules
- `docs/INDEX.md` - Documentation index

---

## 🏆 THE GOAL

**From now on:** AI Agent NEVER creates files in wrong location because:

1. ✅ Mandate exists and is clear
2. ✅ Protocol is documented
3. ✅ Workflow is defined
4. ✅ Checklist is mandatory
5. ✅ User expects compliance

**Result:** Zero misplaced files = clean, professional project structure

---

**Status:** 🟢 **MANDATE IN EFFECT**  
**Effective Date:** November 1, 2025  
**Last Violation:** Nov 1, 2025 (4 files in root) → CORRECTED

**Next violation should not happen.** If it does, review this mandate.
