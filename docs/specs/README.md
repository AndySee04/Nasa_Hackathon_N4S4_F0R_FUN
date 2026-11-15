# Specs and branch plan

The project now has two parallel work streams, each on its own branch:

| Branch | Team | Spec | What it builds |
|---|---|---|---|
| `game` | Game team | [game-moon-campaign.md](game-moon-campaign.md) (on the `game` branch) | The Moon campaign: landing, rocket catcher, artifact discovery, simulator repairs, quiz, stars, badges, certificate |
| `ai` | AI team | [ai-cosmic-tutor.md](ai-cosmic-tutor.md) (on the `ai` branch) | Cosmic AI: safety, intent routing, curated knowledge base, retrieval, one-call answer generation, suggestions, sources, cache |

Shared files (identical on both branches):

- [00-refined-master-spec.md](00-refined-master-spec.md): our analysis of the ChatGPT master prompt, the corrections we made, and the agreed scope.
- [contract-game-ai.md](contract-game-ai.md): the only interface between the two streams. Change it only by agreement, and on both branches.
- [original-master-prompt.md](original-master-prompt.md): the ChatGPT prompt exactly as received, kept for reference.

## How the two branches flow into `main`

```
main (protected: PR + CI required)
 ├── game  ← game/<feature> branches merge here
 └── ai    ← ai/<feature> branches merge here
```

1. Start new work from the team branch: `git checkout game && git pull && git checkout -b game/rocket-catcher`.
2. Open a pull request into the team branch (`game` or `ai`). CI runs on every pull request.
3. When a milestone is finished and green, open a pull request from `game` (or `ai`) into `main`.
4. Merge `main` back into each team branch after anything lands there, so the branches don't drift: `git checkout game && git merge origin/main`.

The game must work with the AI switched off, and the AI must work without the game. They meet only through the contract.
