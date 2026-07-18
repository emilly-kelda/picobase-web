# Versioning & Restore

## Why no `/backups` folder

A backup folder that compresses "the essential files" into the repo on
every update would duplicate two things that already do this job:

1. **Git** already keeps a full, restorable snapshot of every file at every
   commit — that's what git *is*. Compressing files into a zip inside the
   repo would just be a second, worse copy of what git already tracks.
2. **Vercel** keeps every deployment it's ever built. Any previous deploy
   can be promoted back to production from the Vercel dashboard in one
   click, instantly — no rebuild, no waiting.

Adding a real backup folder would only grow the repo's size forever (old
zips never delete themselves) without adding any actual safety margin.

## What to do instead: named tags

A git tag is a permanent, named pointer to one exact commit — exactly the
"restore point with a name" this project needs, using a feature git already
has.

### Creating a checkpoint

After a meaningful milestone (a batch of features, before a risky change,
end of a work session), tag the current commit:

```bash
git tag -a v1-YYYY-MM-DD-short-description -m "One-line summary of what's in this checkpoint"
git push origin v1-YYYY-MM-DD-short-description
```

Example from this project:

```bash
git tag -a v1-2026-07-18-post-hardening -m "Data hardening, weather widget, notice board, package auto-debit"
git push origin v1-2026-07-18-post-hardening
```

Naming convention: `v<N>-<date>-<short-slug>`. The number increments per
tag; the date and slug make it human-readable without needing to look up
what the tag points to.

### Listing checkpoints

```bash
git tag -l                  # names only
git tag -l -n99             # names + full annotation message
```

### Restoring to a checkpoint

**To look at it without changing anything** (safe, non-destructive):

```bash
git checkout v1-2026-07-18-post-hardening
# ...look around...
git checkout main           # back to the current tip
```

**To actually roll `main` back to it** (this rewrites history on `main` —
confirm with whoever else has this repo cloned before doing this on a
shared branch):

```bash
git reset --hard v1-2026-07-18-post-hardening
git push --force origin main
```

**To roll back just the production deployment without touching git at
all** (usually the faster, safer option for "this update broke something,
revert now"): open the Vercel dashboard → Deployments → find the last-good
deployment → "Promote to Production". This is instant and doesn't require
any git operation.

### What if I need a specific file back, not the whole repo?

```bash
git show v1-2026-07-18-post-hardening:path/to/file.tsx > path/to/file.tsx
```

## Suggested cadence

Tag at the end of each work session or logical batch of changes — not
every single commit (that would make the tag list as noisy as the commit
log itself, defeating the purpose of having named checkpoints). A good rule
of thumb: if you'd want to be able to say "go back to how things were right
before we did X," that's a tagging moment.
