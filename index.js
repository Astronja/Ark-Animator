import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import SpineExport from './spine-export.js';

const app = express();
const port = process.env.PORT || 3000;

const models = JSON.parse(await fs.readFile("Ark-Models/models_data.json")).data;
const auth = key => process.env.KEY === key;
const assetAvailable = (skinId, type) => {
    if ((type === 'base' && models[skinId])
        || (type === 'dyn' && models[`dyn_illust_${skinId.replace("dyn_illust_", "")}`])
        || (type === 'enemy' && models[skinId])
    ) return true;
    return false;
};

app.get('/', (req, res) => {
    res.send('Hello from Dusk!');
});

app.get('/gen', async (req, res) => {
    const { type, skinId, key } = req.query;
    if (!auth(key)) return res.status(401).json({ error: 'Unauthorized' });
    if (!assetAvailable(skinId, type)) return res.status(404).json({ error: 'Skin not found' });

    try {
        switch(type) {
            case 'base':
                await SpineExport.baseSprite(path.join(__dirname, "Ark-Models/models", skinId));
                return res.json({ success: true });
            case 'dyn':
                const dynId = `dyn_illust_${skinId.replace("dyn_illust_", "")}`;
                await SpineExport.live2D(path.join(__dirname, "Ark-Models/models_illust", dynId));
                return res.json({ success: true });
            case 'enemy':
                const enemyId = skinId.replace("enemy_", "");
                await SpineExport.enemy(path.join(__dirname, "Ark-Models/models_enemies", enemyId));
                return res.json({ success: true });
            default:
                return res.status(400).json({ error: 'Invalid type' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Dusk is running at http://localhost:${port}`);
});