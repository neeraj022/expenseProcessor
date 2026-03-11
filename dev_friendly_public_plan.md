# Public Release Plan: Expense Tracker

## Overview
Transform the expense processor into a public-ready project with strong privacy guarantees. Users will deploy with their own credentials (LLM API keys, Google Sheets), ensuring their financial data never touches any third-party servers except the services they control.

## Privacy Model
- **LLM Processing**: Users bring their own API keys (Gemini/Claude/OpenAI)
- **Data Storage**: Users create their own Google Sheet + service account
- **Deployment**: Self-hosted on Railway/Render/Docker
- **Zero Trust**: No centralized service, all credentials user-controlled

---

## Implementation Plan

### PHASE 1: CRITICAL SECURITY FIXES (Must do FIRST before going public)

#### 1.1 Fix Password Exposure in qpdf Command
**File**: `services/emailProcessor.service.js:99`

**Issue**: Password visible in process listings and logs
```javascript
execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);
```

**Fix**: Use password file with secure permissions
```javascript
const passwordFile = path.join(tempDir, '.pwd');
fs.writeFileSync(passwordFile, password, { mode: 0o600 });
execSync(`qpdf --password-file="${passwordFile}" --decrypt "${inputPath}" "${outputPath}"`);
fs.unlinkSync(passwordFile);
```

#### 1.2 Sanitize Logging

**Create**: `utils/logger.js`
- Implement log levels (debug, info, warn, error)
- Add sanitization for sensitive fields (password, apiKey, token, secret, authorization)
- Support ENABLE_VERBOSE_LOGGING env var for detailed logging

**Update**: `index.js:10-14`
- Remove raw header logging (can contain API keys)
- Replace with sanitized logging using new logger utility

**Update**: `routes/email.routes.js:22`
- Remove raw body logging (exposes securityKey)
- Replace with sanitized message

**Update**: `services/emailProcessor.service.js`
- Keep informational logs but use logger utility
- Ensure no password values leak in logs

#### 1.3 Rotate ALL Current Credentials

Before making repo public, rotate:
1. **Gemini API Key**: Create new at https://makersuite.google.com/app/apikey
2. **Anthropic API Key**: Create new at https://console.anthropic.com/
3. **Google Service Account**: Delete current, create new, re-share sheet
4. **Security Key**: Generate new with `openssl rand -hex 32`
5. **Update production**: Update Railway/Render env vars (do NOT commit new .env)

---

### PHASE 2: ENVIRONMENT VALIDATION

#### 2.1 Create Environment Validator

**Create**: `config/env.validator.js`
- Validate required vars: GOOGLE_CREDENTIALS, GOOGLE_SHEET_ID, LLM_PROVIDER, SECURITY_KEY
- Validate provider-specific vars: GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY
- Return clear error messages with helpful guidance
- Warn for optional but recommended vars

**Update**: `index.js` (after line 1)
- Add validator import and call before server starts
- Exit with code 1 if validation fails
- Display warnings for missing optional vars

---

### PHASE 3: CONFIGURATION FILES

#### 3.1 Create Template Files

**Create**: `.env.example`
- Document all environment variables with comments
- Include setup instructions as comments
- Link to detailed setup guides in README
- Show example values (not real credentials)
- Include logging configuration options

**Create**: `docker-compose.yml`
- Simple service definition
- Mount .env file
- Expose port 8080
- Add healthcheck using /health endpoint
- Include restart policy

**Create**: `railway.json` and `railway.toml`
- Configure Dockerfile build
- Set deployment settings
- Define healthcheck path

**Create**: `render.yaml`
- Configure Docker deployment
- Define environment variables (prompts user to fill)
- Set free tier as default
- Configure healthcheck

---

### PHASE 4: COMPREHENSIVE DOCUMENTATION

#### 4.1 Create README.md

Structure:
1. **Project Overview**: What it does, why it's useful
2. **Privacy & Security Model**: Clear explanation of data flow
3. **Data Flow Diagram**: Visual representation showing user controls all data
4. **Features**: Bullet points of capabilities
5. **Quick Start**: One-click deploy buttons for Railway/Render
6. **Setup Instructions**:
   - Google Sheets setup (step-by-step with screenshots links)
   - LLM API key setup (all three providers)
   - Security key generation
   - PDF password configuration
7. **Deployment Options**: Railway, Render, Docker, Local
8. **Environment Variables**: Table with descriptions
9. **Usage**: API endpoint examples
10. **Architecture**: Project structure explanation
11. **Supported Banks**: List with instructions to add more
12. **Troubleshooting**: Common issues and solutions
13. **Contributing**: Link to CONTRIBUTING.md
14. **License**: Link to LICENSE
15. **Disclaimer**: Privacy and security considerations

#### 4.2 Create CONTRIBUTING.md

Include:
- How to contribute
- Development setup
- Coding standards
- Testing requirements
- Adding new banks (detailed guide)
- Security considerations (never commit secrets)
- Pull request guidelines

#### 4.3 Create LICENSE

- Use MIT License (permissive, good for open source projects)
- Include copyright year and your name

---

### PHASE 5: REPOSITORY STRUCTURE

#### 5.1 Update package.json

Add/Update:
- Description field
- Keywords: expense, tracker, ai, pdf, google-sheets, automation
- Author field
- License: MIT
- Repository URL
- Scripts:
  - `start`: node index.js
  - `dev`: nodemon index.js
  - `validate`: run env.validator.js
- Engines: node >=18.0.0

#### 5.2 Update .gitignore

Add comprehensive exclusions:
```
# Logs
logs
*.log

# Runtime
pids
*.pid
*.seed

# Environment
.env
.env.local
.env.*.local

# Editors
.vscode
.idea
*.swp

# Existing
.aider*
node_modules
credentials.json
token.json
test.js
```

---

### PHASE 6: TESTING & VALIDATION

#### 6.1 Pre-Release Testing

Test locally:
1. Environment validation with missing vars
2. All three LLM providers (Gemini, Claude, OpenAI)
3. Encrypted and non-encrypted PDFs
4. Google Sheets integration
5. Docker build and run
6. Security: Check logs for sensitive data leakage
7. Security: Verify qpdf password not in process listing

#### 6.2 Deployment Testing

1. Test Railway one-click deploy
2. Test Render one-click deploy
3. Verify healthcheck endpoints work
4. Confirm no sensitive data in platform logs

---

## Implementation Order

**Priority 1 (MUST DO BEFORE PUBLIC)**:
1. ✅ Fix qpdf password exposure (emailProcessor.service.js:99)
2. ✅ Create logger utility (utils/logger.js)
3. ✅ Sanitize all logging (index.js, routes/email.routes.js, services/*)
4. ✅ Rotate ALL credentials (Gemini, Claude, Google, Security Key)
5. ✅ Create .env.example

**Priority 2 (Core Functionality)**:
6. ✅ Create environment validator (config/env.validator.js)
7. ✅ Update index.js to use validator
8. ✅ Create README.md with comprehensive setup guide
9. ✅ Create LICENSE (MIT)
10. ✅ Update package.json metadata

**Priority 3 (Deployment)**:
11. ✅ Create docker-compose.yml
12. ✅ Create railway.json and railway.toml
13. ✅ Create render.yaml
14. ✅ Test Docker build locally
15. ✅ Test Railway deployment
16. ✅ Test Render deployment

**Priority 4 (Polish)**:
17. ✅ Create CONTRIBUTING.md
18. ✅ Update .gitignore
19. ✅ Final security validation
20. ✅ Create GitHub repository and push

---

## Critical Files to Modify

| File | Action | Priority |
|------|--------|----------|
| `services/emailProcessor.service.js` | Fix line 99 password exposure | P1 |
| `utils/logger.js` | CREATE - logging utility | P1 |
| `index.js` | Remove header logging, add validation | P1 |
| `routes/email.routes.js` | Remove body logging | P1 |
| `.env.example` | CREATE - template for users | P1 |
| `config/env.validator.js` | CREATE - env validation | P2 |
| `README.md` | CREATE - comprehensive docs | P2 |
| `LICENSE` | CREATE - MIT license | P2 |
| `package.json` | Update metadata | P2 |
| `docker-compose.yml` | CREATE - easy Docker setup | P3 |
| `railway.json` | CREATE - Railway config | P3 |
| `render.yaml` | CREATE - Render config | P3 |
| `CONTRIBUTING.md` | CREATE - contribution guide | P4 |
| `.gitignore` | Update with comprehensive list | P4 |

---

## Post-Release Recommendations

After making repository public:
1. Enable GitHub Dependabot for security updates
2. Add SECURITY.md for vulnerability reporting
3. Consider GitHub Actions for CI/CD
4. Create demo video or screenshots
5. Add issue templates
6. Monitor first user feedback closely

---

## Security Checklist Before Going Public

- [ ] qpdf password exposure fixed
- [ ] All logging sanitized (no passwords, keys, or tokens)
- [ ] Environment validation implemented
- [ ] .env.example created (no real credentials)
- [ ] .env removed from working directory
- [ ] .gitignore verified correct
- [ ] Git history verified clean (no secrets committed)
- [ ] ALL credentials rotated (Gemini, Claude, Google, Security Key)
- [ ] Production env vars updated (Railway/Render)
- [ ] README includes clear privacy model explanation
- [ ] License file created
- [ ] Local testing completed
- [ ] Deployment testing completed
- [ ] Final log review (no sensitive data)

---

## Success Criteria

When complete:
✅ Users can deploy in under 10 minutes with clear instructions
✅ All user data stays under user control (their LLM API, their Google Sheet)
✅ Zero secrets in repository or git history
✅ One-click deploy works on Railway and Render
✅ Comprehensive documentation addresses privacy concerns
✅ Clean, professional codebase ready for public contributions
