# 🔐 GitHub SSH Setup - Vodič

## Zašto SSH umesto Token-a?

✅ **Sigurnije** - Token nije u URL-u  
✅ **Praktičnije** - Ne treba da unosiš token svaki put  
✅ **Profesionalnije** - Standardna praksa za development  

---

## 📋 Korak po Korak

### 1. Proveri da li već imaš SSH key

```bash
ls -la ~/.ssh/id_*.pub
```

Ako vidiš fajlove kao `id_rsa.pub` ili `id_ed25519.pub`, preskoči na korak 3.

---

### 2. Generiši novi SSH key

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**Ili ako tvoj sistem ne podržava ed25519:**
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**Kada te pita:**
- **File location**: Pritisni Enter (koristi default: `~/.ssh/id_ed25519`)
- **Passphrase**: Možeš ostaviti prazno ili dodati passphrase za dodatnu sigurnost

---

### 3. Pokreni SSH agent

```bash
eval "$(ssh-agent -s)"
```

**Dodaj key u agent:**
```bash
ssh-add ~/.ssh/id_ed25519
```

**Ili ako koristiš RSA:**
```bash
ssh-add ~/.ssh/id_rsa
```

---

### 4. Kopiraj Public Key

**Na macOS:**
```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

**Ili ako koristiš RSA:**
```bash
pbcopy < ~/.ssh/id_rsa.pub
```

**Ili ručno:**
```bash
cat ~/.ssh/id_ed25519.pub
```

---

### 5. Dodaj Key na GitHub

1. Idi na: https://github.com/settings/keys
2. Klikni **"New SSH key"**
3. **Title**: Npr. "MacBook Pro" ili "Development Machine"
4. **Key**: Zalepi kopirani key (Ctrl+V ili Cmd+V)
5. Klikni **"Add SSH key"**

---

### 6. Testiraj konekciju

```bash
ssh -T git@github.com
```

**Očekivani odgovor:**
```
Hi veraconnectgroup-tech! You've successfully authenticated, but GitHub does not provide shell access.
```

---

### 7. Promeni Remote URL na SSH

**Trenutno (sa token-om):**
```bash
git remote set-url origin git@github.com:veraconnectgroup-tech/BioVera.git
```

**Proveri:**
```bash
git remote -v
```

Trebalo bi da vidiš:
```
origin  git@github.com:veraconnectgroup-tech/BioVera.git (fetch)
origin  git@github.com:veraconnectgroup-tech/BioVera.git (push)
```

---

### 8. Testiraj Push

```bash
git push origin main
```

Ako radi bez unosa password-a, sve je u redu! ✅

---

## 🔧 Troubleshooting

### Problem: "Permission denied (publickey)"

**Rešenje:**
1. Proveri da li je key dodat u SSH agent:
   ```bash
   ssh-add -l
   ```

2. Ako nije, dodaj ga:
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. Proveri da li je key dodat na GitHub:
   - Idi na: https://github.com/settings/keys
   - Trebalo bi da vidiš svoj key

---

### Problem: "Host key verification failed"

**Rešenje:**
```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

---

### Problem: SSH agent ne radi nakon restart-a

**Rešenje:** Dodaj u `~/.ssh/config`:

```
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

---

## ✅ Checklist

- [ ] SSH key generisan
- [ ] Key dodat u SSH agent
- [ ] Public key kopiran
- [ ] Key dodat na GitHub
- [ ] Test konekcije uspešan
- [ ] Remote URL promenjen na SSH
- [ ] Test push uspešan

---

## 🎯 Rezultat

Nakon ovoga:
- ✅ Nećeš morati da unosiš token
- ✅ Push i pull će raditi automatski
- ✅ Sigurnije nego token u URL-u
- ✅ Profesionalniji setup

---

**Sve spremno! Javi ako ima problema.** 🚀
