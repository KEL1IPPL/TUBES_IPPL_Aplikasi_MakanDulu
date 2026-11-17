USE makandulu_db;

UPDATE PreferensiMakanan
SET rasaFavorit = COALESCE(rasaFavorit, '[]'),
    kategoriFavorit = COALESCE(kategoriFavorit, '[]');

ALTER TABLE PreferensiMakanan
    MODIFY rasaFavorit TEXT NOT NULL,
    MODIFY kategoriFavorit TEXT NOT NULL,
    ADD COLUMN polaMakan TEXT NULL AFTER kategoriFavorit,
    ADD COLUMN waktuDiubah DATETIME NULL AFTER polaMakan;

UPDATE PreferensiMakanan
SET polaMakan = '[]',
    waktuDiubah = CURRENT_TIMESTAMP
WHERE polaMakan IS NULL OR waktuDiubah IS NULL;

ALTER TABLE PreferensiMakanan
    MODIFY polaMakan TEXT NOT NULL,
    MODIFY waktuDiubah DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    ADD CONSTRAINT uq_preferensi_pembeli UNIQUE (idPembeli);
