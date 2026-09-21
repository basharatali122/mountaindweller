# Mountain Dweller — Play Store submission guide (PWA + TWA)

Website ab installable app hai (manifest + icons + theme color). Ab Play Store par upload karne ke steps:

## 1. App package banao (Bubblewrap)
Apne computer par (Node 18+ aur Java 17 install hona chahiye):

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://mountaindweller.lovable.app/manifest.webmanifest
# Package name poocha jaye to: com.mountaindweller.app
bubblewrap build
```

Output: `app-release-bundle.aab` (Play Store par yehi upload hota hai) + `android.keystore` (isko safe rakho, kho jaye to update nahi ho sakta).

## 2. Digital Asset Links (address bar hide karne ke liye — zaroori)
1. Play Console > Setup > App integrity se **SHA-256 certificate fingerprint** copy karo.
2. `public/.well-known/assetlinks.json` mein `REPLACE_WITH_YOUR_PLAY_APP_SIGNING_SHA256_FINGERPRINT` ki jagah wohi fingerprint paste karo (mujhe bhej dena, main laga dunga).
3. App dobara publish karo. Verify: `https://<domain>/.well-known/assetlinks.json` khulna chahiye.

Agar yeh step na ho to app ke andar browser wali URL bar dikhegi.

## 3. Play Console listing
- Developer account fee: one-time **$25**.
- Chahiye: app name, short + full description, 512x512 icon (`public/icon-512.png`), 1024x500 feature graphic, 2-8 phone screenshots.
- Privacy Policy URL: `/privacy-policy` (already live).
- Data safety form bharna hoga (email, naam, payment proof images collect hote hain).
- Content rating questionnaire + target audience (18+ recommended, financial app hai).

## 4. Zaroori warnings (rejection se bachne ke liye)
- Google Play "investment / earning opportunity" apps ko strictly dekhta hai. Listing mein guaranteed profit ya "investment returns" jaise claims **na** likho — "business packages & products" wording use karo.
- Financial features ke liye business registration documents maango jaa sakte hain (SECP certificate ready rakho).
- Manual bank transfer deposit theek hai; in-app digital goods bechne par Play Billing ki policy lag sakti hai — description mein physical products/services clear karo.

## 5. Review time
Pehli app ka review normally 3-7 din (naye accounts par 14 din tak ho sakta hai).
