# Bookhatch AI - Frontend Monorepo

> **Every call answered, Every job booked. Built by DAU Labs**  
> Workspace for the Bookhatch AI platform shell, microfrontends, and shared design system.

## Layout

- `apps/platform-shell`: current platform shell app
- `apps/appointment-setter`: appointment-setter microfrontend scaffold
- `apps/chatbot-agents`: chatbot-agents microfrontend scaffold
- `packages/*`: shared internal frontend packages

## Scripts

- `pnpm install`
- `pnpm build`
- `pnpm dev:platform-shell`
- `pnpm dev:appointment-setter`
- `pnpm dev:chatbot-agents`

## Notes

- Backend remains in its own repository.
- Path-based microfrontend deployment is scaffolded here, while production route cutover should happen only after app-specific surfaces are fully migrated.
