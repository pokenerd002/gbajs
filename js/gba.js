
GameBoyAdvance.prototype.setSavedata = function(data) {
    this.mmu.loadSavedata(data);
};

GameBoyAdvance.prototype.loadSavedataFromFile = function(saveFile) {
    var reader = new FileReader();
    var self = this;
    reader.onload = function(e) {
        self.setSavedata(e.target.result);
    }
    reader.readAsArrayBuffer(saveFile);
};

GameBoyAdvance.prototype.decodeSavedata = function(string) {
    this.setSavedata(this.decodeBase64(string));
};

GameBoyAdvance.prototype.decodeBase64 = function(string) {
    var length = (string.length * 3 / 4);

    if (string[string.length - 2] == '=') {
        length -= 2;
    } else if (string[string.length - 1] == '=') {
        length -= 1;
    }

    var buffer = new ArrayBuffer(length);
    var view = new Uint8Array(buffer);
    var bits = string.match(/..../g);

    for (var i = 0; i + 2 < length; i += 3) {
        var s = atob(bits.shift());
        view[i] = s.charCodeAt(0);
        view[i + 1] = s.charCodeAt(1);
        view[i + 2] = s.charCodeAt(2);
    }

    if (i < length) {
        var s = atob(bits.shift());
        view[i++] = s.charCodeAt(0);

        if (s.length > 1) {
            view[i++] = s.charCodeAt(1);
        }
    }

    return buffer;
};

GameBoyAdvance.prototype.encodeBase64 = function(view) {
    var data = [];
    var b;
    var wordstring = [];
    var triplet;

    for (var i = 0; i < view.byteLength; ++i) {
        b = view.getUint8(i, true);
        wordstring.push(String.fromCharCode(b));

        while (wordstring.length >= 3) {
            triplet = wordstring.splice(0, 3);
            data.push(btoa(triplet.join('')));
        }
    };

    if (wordstring.length) {
        data.push(btoa(wordstring.join('')));
    }

    return data.join('');
};


// UPDATED SAVE DOWNLOAD FUNCTION
GameBoyAdvance.prototype.downloadSavedata = function() {
    var sram = this.mmu.save;

    if (!sram) {
        this.WARN("No save data available");
        return null;
    }

    var gameCode = this.mmu.cart && this.mmu.cart.code
        ? this.mmu.cart.code
        : "game";

    var filename = gameCode + ".sav";

    var blob = new Blob([sram.buffer], {
        type: "application/octet-stream"
    });

    var url = window.URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(function() {
        window.URL.revokeObjectURL(url);
    }, 1000);

    return filename;
};


// THE REST OF YOUR ORIGINAL CODE CONTINUES BELOW
GameBoyAdvance.prototype.storeSavedata = function() {
    var sram = this.mmu.save;

    try {
        var storage = window.localStorage;
        storage[this.SYS_ID + '.' + this.mmu.cart.code] =
            this.encodeBase64(sram.view);
    } catch (e) {
        this.WARN('Could not store savedata! ' + e);
    }
};
