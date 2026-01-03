<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## 使用台灣正體中文進行回應

一率使用 zh-TW 進行回應與文件撰寫

## 任務驗證

討論與計劃階段有任何需要確認的問題，先把問題進行統整研究告一個段落後再一次提出
而任務執行階段，除非任務進度有重大風險，就以你判斷的最優先方案持續進行
任務告一個段落後務必要進行驗證，確認服務可以正確啟動、執行，通過測試與型別檢查，符合任務 task 驗證要求

## 套件管理工具使用 pnpm
