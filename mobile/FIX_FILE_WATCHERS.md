# Rešavanje "EMFILE: too many open files" problema

## Problem
macOS ima ograničenje na broj fajlova koje proces može da prati. Expo/Metro bundler prati mnogo fajlova i prelazi limit.

## Rešenje 1: Koristi start.sh skriptu
```bash
./start.sh
```

## Rešenje 2: Ručno postavi limit
```bash
ulimit -n 10240
npx expo start -c
```

## Rešenje 3: Trajno rešenje (dodaj u ~/.zshrc)
```bash
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc
```

## Rešenje 4: Instaliraj watchman (preporučeno)
```bash
brew install watchman
```

Watchman je Facebook-ov alat koji efikasnije prati promene fajlova.

## Rešenje 5: Restartuj terminal
Nakon što dodaš `ulimit -n 10240` u `.zshrc`, restartuj terminal.

