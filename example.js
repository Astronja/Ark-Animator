import fs from 'fs/promises';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const url = `http://localhost:${process.env.PORT || 3000}/`;
const req = async (type, id) => {
    return await (await fetch(`${url}gen?` + new URLSearchParams({
        type: type,
        skinId: id,
        key: process.env.KEY
    }))).json();
}
const execute = async () => {
    console.log(await req('base', '002_amiya'));
    //'dyn', 'dyn_illust_1037_amiya3_sale#13' is also okay
    console.log(await req('dyn', '1037_amiya3_sale#13'));
    //'enemy', enemy_2092_skzamy is also okay
    console.log(await req('enemy', '2092_skzamy'));
}

//execute();
(async () => {
    
})();