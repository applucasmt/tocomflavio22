# 🖼️ Criador de Molduras IA

Aplicativo web **100% gratuito e open source** para criar fotos com molduras personalizadas usando **IA que roda no navegador** (sem servidor, sem API paga).

![Preview](icons/icon-512.png)

## ✨ Recursos

- 🤖 **Remoção de fundo com IA** — modelo U²-Net, roda no navegador
- 🎯 **Detecção facial automática** — centraliza o rosto na moldura
- 📷 **Câmera ao vivo** com preview da moldura em tempo real
- 🖼️ **Múltiplas molduras** — basta adicionar PNGs na pasta `frames/`
- 📱 **PWA instalável** — funciona offline depois da 1ª visita
- 💾 **Exportação em alta resolução** (1080×1080)
- 🚀 **Zero backend** — hospedado no GitHub Pages
- 🔓 **Sem chave de API** — privacidade total (foto nunca sai do dispositivo)

## 🚀 Como usar

1. Acesse: `https://SEU-USUARIO.github.io/molduras-ia/`
2. Toque em **Galeria** ou **Câmera**
3. Ajuste com **arraste** e **pinça**
4. Toque em **Recortar fundo com IA** (opcional)
5. Toque em **Salvar / Compartilhar**

## 🛠️ Como adicionar novas molduras

1. Coloque o arquivo PNG (com o centro transparente) em `frames/`
2. Nomeie como `mold-09.png`, `mold-10.png`...
3. Edite `js/frames.js` e adicione no array `FRAMES_URLS`:

```js
const FRAMES_URLS = [
  "frames/mold-01.png",
  // ...
  "frames/mold-09.png"  // ← nova
];
```

## 🧠 Tecnologias open source

| Lib | Uso | Licença |
|---|---|---|
| [@imgly/background-removal](https://github.com/imgly/background-removal-js) | Remoção de fundo | Apache 2.0 |
| [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) | Detecção facial | Apache 2.0 |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | Cache IndexedDB | MIT |

## 📄 Licença

MIT — veja [LICENSE](LICENSE)
