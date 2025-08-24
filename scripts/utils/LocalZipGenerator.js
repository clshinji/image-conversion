// ローカルZIP生成クラス - 外部依存関係なし
export class LocalZipGenerator {
    constructor() {
        this.files = [];
        this.compressionLevel = 6; // デフォルト圧縮レベル
    }

    /**
     * ファイルをZIPに追加
     */
    addFile(filename, data, options = {}) {
        try {
            // データの正規化
            let fileData;
            if (typeof data === 'string') {
                fileData = new TextEncoder().encode(data);
            } else if (data instanceof ArrayBuffer) {
                fileData = new Uint8Array(data);
            } else if (data instanceof Uint8Array) {
                fileData = data;
            } else if (data instanceof Blob) {
                // Blobは非同期で処理する必要があるため、エラーを投げる
                throw new Error('Blobデータは addFileAsync メソッドを使用してください');
            } else {
                throw new Error('サポートされていないデータ形式です');
            }

            this.files.push({
                filename: filename,
                data: fileData,
                timestamp: options.timestamp || new Date(),
                comment: options.comment || ''
            });

            console.log(`ファイルをZIPに追加: ${filename} (${fileData.length} bytes)`);
            return true;

        } catch (error) {
            console.error(`ファイル追加エラー (${filename}):`, error);
            throw error;
        }
    }

    /**
     * Blobファイルを非同期でZIPに追加
     */
    async addFileAsync(filename, blob, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    this.addFile(filename, arrayBuffer, options);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error(`ファイル読み込みエラー: ${filename}`));
            };
            
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * 複数ファイルを一括追加
     */
    async addFiles(fileList) {
        const results = [];
        
        for (const fileInfo of fileList) {
            try {
                if (fileInfo.data instanceof Blob) {
                    await this.addFileAsync(fileInfo.filename, fileInfo.data, fileInfo.options);
                } else {
                    this.addFile(fileInfo.filename, fileInfo.data, fileInfo.options);
                }
                results.push({ filename: fileInfo.filename, success: true });
            } catch (error) {
                console.error(`ファイル追加失敗: ${fileInfo.filename}`, error);
                results.push({ filename: fileInfo.filename, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * ZIPファイルを生成
     */
    async generateZip() {
        try {
            console.log(`ZIP生成開始: ${this.files.length}個のファイル`);
            
            if (this.files.length === 0) {
                throw new Error('ZIPに追加するファイルがありません');
            }

            // ZIP構造を構築
            const zipData = this.buildZipStructure();
            
            // Blobとして返す
            const zipBlob = new Blob([zipData], { type: 'application/zip' });
            
            console.log(`✓ ZIP生成完了: ${zipBlob.size} bytes`);
            return zipBlob;

        } catch (error) {
            console.error('ZIP生成エラー:', error);
            throw error;
        }
    }

    /**
     * ZIP構造を構築（簡易実装）
     */
    buildZipStructure() {
        const centralDirectory = [];
        const fileData = [];
        let offset = 0;

        // 各ファイルのローカルファイルヘッダーとデータを作成
        for (const file of this.files) {
            const localFileHeader = this.createLocalFileHeader(file);
            const fileEntry = new Uint8Array(localFileHeader.length + file.data.length);
            
            // ローカルファイルヘッダーをコピー
            fileEntry.set(localFileHeader, 0);
            // ファイルデータをコピー
            fileEntry.set(file.data, localFileHeader.length);
            
            fileData.push(fileEntry);
            
            // セントラルディレクトリエントリを作成
            const centralDirEntry = this.createCentralDirectoryEntry(file, offset, localFileHeader.length);
            centralDirectory.push(centralDirEntry);
            
            offset += fileEntry.length;
        }

        // すべてのファイルデータを結合
        const totalFileDataSize = fileData.reduce((sum, data) => sum + data.length, 0);
        const allFileData = new Uint8Array(totalFileDataSize);
        let currentOffset = 0;
        
        for (const data of fileData) {
            allFileData.set(data, currentOffset);
            currentOffset += data.length;
        }

        // セントラルディレクトリを結合
        const totalCentralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
        const allCentralDir = new Uint8Array(totalCentralDirSize);
        currentOffset = 0;
        
        for (const entry of centralDirectory) {
            allCentralDir.set(entry, currentOffset);
            currentOffset += entry.length;
        }

        // End of Central Directory レコードを作成
        const endOfCentralDir = this.createEndOfCentralDirectory(
            this.files.length,
            totalCentralDirSize,
            totalFileDataSize
        );

        // 最終的なZIPデータを結合
        const zipSize = totalFileDataSize + totalCentralDirSize + endOfCentralDir.length;
        const zipData = new Uint8Array(zipSize);
        
        zipData.set(allFileData, 0);
        zipData.set(allCentralDir, totalFileDataSize);
        zipData.set(endOfCentralDir, totalFileDataSize + totalCentralDirSize);

        return zipData;
    }

    /**
     * ローカルファイルヘッダーを作成
     */
    createLocalFileHeader(file) {
        const filename = new TextEncoder().encode(file.filename);
        const headerSize = 30 + filename.length;
        const header = new Uint8Array(headerSize);
        const view = new DataView(header.buffer);

        let offset = 0;

        // ローカルファイルヘッダー署名
        view.setUint32(offset, 0x04034b50, true); offset += 4;
        
        // バージョン
        view.setUint16(offset, 20, true); offset += 2;
        
        // 汎用ビットフラグ
        view.setUint16(offset, 0, true); offset += 2;
        
        // 圧縮方法（0 = 無圧縮）
        view.setUint16(offset, 0, true); offset += 2;
        
        // 最終更新時刻
        const dosTime = this.toDosTime(file.timestamp);
        view.setUint16(offset, dosTime.time, true); offset += 2;
        view.setUint16(offset, dosTime.date, true); offset += 2;
        
        // CRC-32
        const crc32 = this.calculateCRC32(file.data);
        view.setUint32(offset, crc32, true); offset += 4;
        
        // 圧縮サイズ
        view.setUint32(offset, file.data.length, true); offset += 4;
        
        // 非圧縮サイズ
        view.setUint32(offset, file.data.length, true); offset += 4;
        
        // ファイル名長
        view.setUint16(offset, filename.length, true); offset += 2;
        
        // 拡張フィールド長
        view.setUint16(offset, 0, true); offset += 2;
        
        // ファイル名
        header.set(filename, offset);

        return header;
    }

    /**
     * セントラルディレクトリエントリを作成
     */
    createCentralDirectoryEntry(file, localHeaderOffset, localHeaderSize) {
        const filename = new TextEncoder().encode(file.filename);
        const comment = new TextEncoder().encode(file.comment);
        const entrySize = 46 + filename.length + comment.length;
        const entry = new Uint8Array(entrySize);
        const view = new DataView(entry.buffer);

        let offset = 0;

        // セントラルディレクトリ署名
        view.setUint32(offset, 0x02014b50, true); offset += 4;
        
        // 作成バージョン
        view.setUint16(offset, 20, true); offset += 2;
        
        // 展開バージョン
        view.setUint16(offset, 20, true); offset += 2;
        
        // 汎用ビットフラグ
        view.setUint16(offset, 0, true); offset += 2;
        
        // 圧縮方法
        view.setUint16(offset, 0, true); offset += 2;
        
        // 最終更新時刻
        const dosTime = this.toDosTime(file.timestamp);
        view.setUint16(offset, dosTime.time, true); offset += 2;
        view.setUint16(offset, dosTime.date, true); offset += 2;
        
        // CRC-32
        const crc32 = this.calculateCRC32(file.data);
        view.setUint32(offset, crc32, true); offset += 4;
        
        // 圧縮サイズ
        view.setUint32(offset, file.data.length, true); offset += 4;
        
        // 非圧縮サイズ
        view.setUint32(offset, file.data.length, true); offset += 4;
        
        // ファイル名長
        view.setUint16(offset, filename.length, true); offset += 2;
        
        // 拡張フィールド長
        view.setUint16(offset, 0, true); offset += 2;
        
        // コメント長
        view.setUint16(offset, comment.length, true); offset += 2;
        
        // ディスク番号
        view.setUint16(offset, 0, true); offset += 2;
        
        // 内部ファイル属性
        view.setUint16(offset, 0, true); offset += 2;
        
        // 外部ファイル属性
        view.setUint32(offset, 0, true); offset += 4;
        
        // ローカルヘッダーのオフセット
        view.setUint32(offset, localHeaderOffset, true); offset += 4;
        
        // ファイル名
        entry.set(filename, offset); offset += filename.length;
        
        // コメント
        if (comment.length > 0) {
            entry.set(comment, offset);
        }

        return entry;
    }

    /**
     * End of Central Directory レコードを作成
     */
    createEndOfCentralDirectory(fileCount, centralDirSize, centralDirOffset) {
        const record = new Uint8Array(22);
        const view = new DataView(record.buffer);

        let offset = 0;

        // End of Central Directory 署名
        view.setUint32(offset, 0x06054b50, true); offset += 4;
        
        // ディスク番号
        view.setUint16(offset, 0, true); offset += 2;
        
        // セントラルディレクトリ開始ディスク番号
        view.setUint16(offset, 0, true); offset += 2;
        
        // このディスクのセントラルディレクトリエントリ数
        view.setUint16(offset, fileCount, true); offset += 2;
        
        // セントラルディレクトリエントリ総数
        view.setUint16(offset, fileCount, true); offset += 2;
        
        // セントラルディレクトリサイズ
        view.setUint32(offset, centralDirSize, true); offset += 4;
        
        // セントラルディレクトリオフセット
        view.setUint32(offset, centralDirOffset, true); offset += 4;
        
        // コメント長
        view.setUint16(offset, 0, true);

        return record;
    }

    /**
     * 日付をDOS形式に変換
     */
    toDosTime(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = Math.floor(date.getSeconds() / 2);

        const dosDate = ((year - 1980) << 9) | (month << 5) | day;
        const dosTime = (hours << 11) | (minutes << 5) | seconds;

        return { date: dosDate, time: dosTime };
    }

    /**
     * CRC-32を計算（簡易実装）
     */
    calculateCRC32(data) {
        // CRC-32テーブル（事前計算済み）
        const crcTable = this.getCRC32Table();
        let crc = 0xFFFFFFFF;

        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * CRC-32テーブルを取得
     */
    getCRC32Table() {
        if (!this.crcTable) {
            this.crcTable = new Uint32Array(256);
            
            for (let i = 0; i < 256; i++) {
                let crc = i;
                for (let j = 0; j < 8; j++) {
                    if (crc & 1) {
                        crc = (crc >>> 1) ^ 0xEDB88320;
                    } else {
                        crc = crc >>> 1;
                    }
                }
                this.crcTable[i] = crc;
            }
        }
        
        return this.crcTable;
    }

    /**
     * ZIPファイルをダウンロード
     */
    async downloadZip(filename = 'converted_images.zip') {
        try {
            const zipBlob = await this.generateZip();
            
            // ダウンロードリンクを作成
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // ダウンロードを実行
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // URLを解放
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log(`✓ ZIPファイルをダウンロード: ${filename}`);
            return true;

        } catch (error) {
            console.error('ZIPダウンロードエラー:', error);
            throw error;
        }
    }

    /**
     * ファイルリストをクリア
     */
    clear() {
        this.files = [];
        console.log('ZIPファイルリストをクリアしました');
    }

    /**
     * ファイル数を取得
     */
    getFileCount() {
        return this.files.length;
    }

    /**
     * 総ファイルサイズを取得
     */
    getTotalSize() {
        return this.files.reduce((total, file) => total + file.data.length, 0);
    }

    /**
     * ファイル情報を取得
     */
    getFileInfo() {
        return this.files.map(file => ({
            filename: file.filename,
            size: file.data.length,
            timestamp: file.timestamp,
            comment: file.comment
        }));
    }
}