
const fs                = require('fs');
const path              = require('path');
const { logWithTime, danger }   = require('@lib/utils');

let plugins = [];
const pluginsPath = path.join(process.cwd(), 'plugins');

function loadPlugins(directory) {
    const loadedPlugins = [];
    try {
        fs.readdirSync(directory).forEach(file => {
            const fullPath = path.join(directory, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                loadedPlugins.push(...loadPlugins(fullPath));
            } else if (file.endsWith('.js')) {
                try {
                    delete require.cache[require.resolve(fullPath)];
                    const plugin = require(fullPath);
                    loadedPlugins.push(plugin);
                } catch (error) {
                    danger('ERROR', `Failed to load plugin: ${fullPath} - ${error.message}`);
                }
            }
        });
    } catch (error) {
        logWithTime('ERROR', `Error reading directory: ${directory} - ${error.message}`);
    }
    return loadedPlugins;
}

function clearRequireCache(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            clearRequireCache(fullPath);
        } else if (file.endsWith('.js')) {
            const resolvedPath = require.resolve(fullPath);
            if (require.cache[resolvedPath]) {
                delete require.cache[resolvedPath];
            }
        }
    });
}

function reloadPlugins() {
    clearRequireCache(pluginsPath);
    plugins = loadPlugins(pluginsPath);
    logWithTime('System', `Plugins reloaded. Total: ${plugins.length}`);
    logWithTime('System', `Load All Plugins done...`);
    return plugins;
}

module.exports = { reloadPlugins };
