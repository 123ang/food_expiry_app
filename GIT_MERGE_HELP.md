# Git Merge Conflict Resolution

## Current Situation
You have local changes to `backend/package-lock.json` that conflict with the remote changes.

## Solution Options

### Option 1: Stash Changes (Recommended)
This temporarily saves your local changes, pulls the updates, then reapplies your changes:

```bash
# Stash your local changes
cd /root/projects/food_expiry_app
git stash

# Pull the latest changes
git pull

# Reapply your stashed changes (if needed)
git stash pop

# If there are conflicts, resolve them, then:
npm install  # Regenerate package-lock.json if needed
```

### Option 2: Discard Local Changes (If package-lock.json changes aren't important)
Since `package-lock.json` is auto-generated, you can discard local changes:

```bash
cd /root/projects/food_expiry_app
git checkout -- backend/package-lock.json
git pull
npm install  # Regenerate package-lock.json
```

### Option 3: Commit Your Changes First
If you want to keep your local changes:

```bash
cd /root/projects/food_expiry_app
git add backend/package-lock.json
git commit -m "Update package-lock.json with @types/pg"
git pull

# If there are merge conflicts, resolve them, then:
git add backend/package-lock.json
git commit -m "Merge package-lock.json"
```

## Recommended Approach

Since you just installed `@types/pg`, I recommend **Option 2** (discard and regenerate):

```bash
cd /root/projects/food_expiry_app
git checkout -- backend/package-lock.json
git pull
cd backend
npm install  # This will regenerate package-lock.json with all dependencies
```

This ensures your `package-lock.json` matches your current `package.json` and includes all dependencies.
