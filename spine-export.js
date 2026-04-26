import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default class SpineExport {
    static CLI = join(__dirname, "published/SpineViewerCLI");
    static baseParams = {
        format: "Webm",
        fps: 30,
        view: "w=1024,h=576,x=0,y=288",
        scale: 1,
        animation: "Relax"
    };
    static enemyParams = {
        format: "Webm",
        fps: 30,
        view: "w=1024,h=576,x=0,y=288",
        scale: 1,
        animation: "Idle"
    };
    static alterEnenmyParams = {
        format: "Webm",
        fps: 30,
        view: "w=1024,h=576,x=0,y=288",
        scale: 1,
        animation: "A_Idle"
    };

    /**
     * Runs the Spine export process with the given parameters.
     * @param {Object} params The parameters for the export process.
     * @param {string} params.skelFile The path to the .skel file.
     * @param {string} params.atlasFile The path to the .atlas file.
     * @param {string} params.outputPath The path where the output file will be saved.
     * @param {Object} params.otherParams The base parameters for the export process, including format, fps, view, scale, and animation.
     * @return {Promise<string>} A promise that resolves with the output when the export process is complete, or rejects if an error occurs.
     */
    static runExport(params) {
        return new Promise((resolve, reject) => {
            const args = [
                "export", params.skelFile,
                "--format", params.otherParams.format,
                "--output", params.outputPath,
                "--animations", params.otherParams.animation,
                "--fixed-view", params.otherParams.view,
                "--fps", String(params.otherParams.fps),
                "--atlas", params.atlasFile,
                "--scale", String(params.otherParams.scale),
                "--pma"
            ];

            let output = "";
            const proc = spawn("xvfb-run", ["-a", this.CLI, ...args]);
            if (!proc) {
                reject(new Error("Failed to spawn process"));
                return;
            }

            proc.stdout.on("data", (data) => { output += data.toString(); });
            proc.stderr.on("data", (data) => { output += data.toString(); });

            proc.on("close", (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Export failed with code ${code}: ${output}`));
                }
            });

            proc.on("error", reject);
        });
    }

    static async skelFilesInDir(assetDir) {
        const files = await fs.readdir(assetDir);
        let hasSkel = false;
        for (let item of files) if (item.endsWith('.skel')) hasSkel = true;
        return hasSkel;
    }

    /**
     * Exports a base sprite.
     * @param {string} assetDir The working directory of the base sprite, expected to end with skin ID.
     * The directory is expected to contain `.skel`, `.atlas`, `.png` files named as `{skinId}.skel`, `{skinId}.atlas`, and `{skinId}.png` respectively.
     * @return {Promise<void>} The method does not return until the export process is complete.
     */
    static async baseSprite(assetDir) {
        let skel = "";
        if (await this.skelFilesInDir(assetDir)) skel = ".skel";
        let skinId = assetDir.split("/").pop();
        await this.runExport({
            skelFile: join(assetDir, `build_char_${skinId}${skel}`),
            atlasFile: join(assetDir, `build_char_${skinId}.atlas`),
            outputPath: join(__dirname, `output/base/${skinId}.webm`),
            otherParams: this.baseParams
        });
    }

    static async calculateCenter(assetDir) {
        const atlasFiles = await fs.readdir(assetDir);
        const atlasFile = atlasFiles.find(f => f.endsWith('.atlas'));
        if (!atlasFile) return { x: 512, y: 512, width: 1024, height: 1024 };

        const content = await fs.readFile(join(assetDir, atlasFile), 'utf-8');
        const lines = content.split('\n');

        let atlasWidth = 2048;
        let atlasHeight = 2048;
        let sumX = 0, sumY = 0, count = 0;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        let currentSprite = null;
        let spriteName = '';
        let spriteSize = { w: 0, h: 0 };

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            
            if (trimmed.startsWith('size:') && !trimmed.includes(',')) {
                const match = trimmed.match(/size:\s*(\d+),(\d+)/);
                if (match) {
                    atlasWidth = parseInt(match[1]);
                    atlasHeight = parseInt(match[2]);
                }
                continue;
            }
            
            if (!trimmed.includes(':') && !trimmed.startsWith('size:') && !trimmed.startsWith('format:') && !trimmed.startsWith('filter:') && !trimmed.startsWith('repeat:') && !trimmed.startsWith('index:') && trimmed.length > 0 && trimmed.length < 30) {
                spriteName = trimmed;
                spriteSize = { w: 0, h: 0 };
                continue;
            }
            
            if (trimmed === 'rotate: false') {
                if (spriteName.startsWith('BG') || spriteName.startsWith('Tree') || spriteName.startsWith('Boat') || spriteName.startsWith('Box') || spriteName.startsWith('Violin')) {
                    currentSprite = null;
                } else {
                    currentSprite = { name: spriteName };
                }
                continue;
            }
            
            if (!currentSprite) continue;
            
            if (trimmed.startsWith('xy:')) {
                const parts = trimmed.replace('xy:', '').trim().split(',');
                if (parts.length === 2) {
                    currentSprite.x = parseInt(parts[0]);
                    currentSprite.y = parseInt(parts[1]);
                }
            } else if (trimmed.startsWith('size:')) {
                const parts = trimmed.replace('size:', '').trim().split(',');
                if (parts.length === 2) {
                    currentSprite.w = parseInt(parts[0]);
                    currentSprite.h = parseInt(parts[1]);
                }
            } else if (trimmed.startsWith('orig:')) {
                const parts = trimmed.replace('orig:', '').trim().split(',');
                if (parts.length === 2) {
                    currentSprite.origW = parseInt(parts[0]);
                    currentSprite.origH = parseInt(parts[1]);
                }
            } else if (trimmed.startsWith('offset:')) {
                const parts = trimmed.replace('offset:', '').trim().split(',');
                if (parts.length === 2) {
                    currentSprite.offsetX = parseInt(parts[0]);
                    currentSprite.offsetY = parseInt(parts[1]);
                    
                    if (currentSprite.x !== undefined && currentSprite.origW !== undefined && currentSprite.w !== undefined) {
                        const atlasX = currentSprite.x + (currentSprite.offsetX || 0);
                        const atlasY = currentSprite.y + (currentSprite.offsetY || 0);
                        
                        const renderX = atlasX;
                        const renderY = atlasHeight - atlasY - currentSprite.h;
                        
                        sumX += renderX + (currentSprite.origW || currentSprite.w) / 2;
                        sumY += renderY + (currentSprite.origH || currentSprite.h) / 2;
                        count++;
                        
                        minX = Math.min(minX, renderX);
                        minY = Math.min(minY, renderY);
                        maxX = Math.max(maxX, renderX + (currentSprite.origW || currentSprite.w));
                        maxY = Math.max(maxY, renderY + (currentSprite.origH || currentSprite.h));
                    }
                    currentSprite = null;
                }
            }
        }

        if (count === 0) return { x: 512, y: 512, width: 1024, height: 1024 };

        const centerX = sumX / count;
        const centerY = sumY / count;
        const width = maxX - minX;
        const height = maxY - minY;

        return { x: Math.round(centerX), y: Math.round(centerY), width: Math.round(width), height: Math.round(height) };
    }

    static async live2D(assetDir) {
        let dynId = assetDir.split("/").pop();
        const center = await this.calculateCenter(assetDir);
        let skel = "";
        if (await this.skelFilesInDir(assetDir)) skel = ".skel";
        const params = {
            format: "Webm",
            fps: 30,
            view: `w=1024,h=1024,x=0,y=${192+Math.round(center.y/2)}`,
            scale: 0.5,
            animation: "Idle"
        };
        await this.runExport({
            skelFile: join(assetDir, `${dynId.replace("dyn_illust", "dyn_illust_char")}${skel}`),
            atlasFile: join(assetDir, `${dynId.replace("dyn_illust", "dyn_illust_char")}.atlas`),
            outputPath: join(__dirname, `output/dyn/${dynId}.webm`),
            otherParams: params
        });
    }

    static async enemy(assetDir) {
        let enemyId = assetDir.split("/").pop();
        let skel = "";
        if (await this.skelFilesInDir(assetDir)) skel = ".skel";
        const output = await this.runExport({
            skelFile: join(assetDir, `enemy_${enemyId}${skel}`),
            atlasFile: join(assetDir, `enemy_${enemyId}.atlas`),
            outputPath: join(__dirname, `output/enemy/${enemyId}.webm`),
            otherParams: this.enemyParams
        });
        if (output.includes("No animation")) {
            await this.runExport({
                skelFile: join(assetDir, `enemy_${enemyId}${skel}`),
                atlasFile: join(assetDir, `enemy_${enemyId}.atlas`),
                outputPath: join(__dirname, `output/enemy/${enemyId}.webm`),
                otherParams: this.alterEnenmyParams
            });
        }
    }
}