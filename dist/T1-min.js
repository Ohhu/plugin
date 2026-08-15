var T1Plugin = {
    platform: "T1·最小骨架",
    author: "Ohhu",
    version: "0.0.1",
    cacheControl: "no-store",
    primaryKey: [ "id" ],
    search: function(query, page, type) {
        return Promise.resolve({
            isEnd: true,
            data: []
        });
    }
};

module.exports = T1Plugin;