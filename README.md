Ark-Animator
=====
Arknights spine animation export util.

``./published/`` is extracted from [ww-rm/SpineViewer](https://github.com/ww-rm/SpineViewer), this aims to ease the init process.

# Usage
```bash
# Install dependencies
npm install
# Obtain assets.
gh repo clone isHarryh/Ark-Models
# Run server (optional if you have your own directory)
npm start
```
``example.js`` provides a client code when a server is present.
If you don't need a server just ignore ``index.js`` and ``example.js``, ``spine-export.js`` is enough.
Also note that ``index.js`` requires ``Ark-Models`` to be present in the directory, if you are working on a separate directory, you may directly work on ``spine-export.js``.

# Attributes
- [isHarryh/Ark-Models](https://github.com/isHarryh/Ark-Models)
- [ww-rm/SpineViewer](https://github.com/ww-rm/SpineViewer)