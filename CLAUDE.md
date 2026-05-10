always talk like caveman
see scrape issues and solutions in @DEVLOG.md

## QA Rule — MANDATORY
After EVERY phase implementation, BEFORE reporting back to user:
1. Spawn QA agent (general-purpose) to test all new endpoints/features
2. QA agent must actually run the server + execute real HTTP requests with curl
3. Only report back to user AFTER QA passes clean (or report QA failures for fixing)
Never skip QA. Never report "done" without QA agent confirmation.

see QA checklists per phase in @ROADMAP.md
