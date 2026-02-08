const sampleSchedule = {
    'Pazartesi': [
        { time: '08:00 - 08:40', lesson: 'SAĞLIK BİLGİSİ', location: 'Pazartesi' },
        { time: '08:50 - 09:30', lesson: 'TÜRK SOSYAL HAYATINDA AİLE', location: 'Pazartesi' },
        { time: '09:40 - 10:20', lesson: 'İNGİLİZCE', location: 'Pazartesi' },
        { time: '10:30 - 11:10', lesson: 'İNGİLİZCE', location: 'Pazartesi' },
        { time: '11:30 - 12:10', lesson: 'BEDEN EĞİTİMİ', location: 'Pazartesi' },
        { time: '13:00 - 13:40', lesson: 'BEDEN EĞİTİMİ', location: 'Pazartesi' },
        { time: '13:50 - 14:30', lesson: 'KİMYA', location: 'Pazartesi' },
        { time: '14:40 - 15:20', lesson: 'KİMYA', location: 'Pazartesi' }
    ],
    'Salı': [
        { time: '08:00 - 08:40', lesson: 'TÜRK DİLİ VE EDEBİYATI', location: 'Salı' },
        { time: '08:50 - 09:30', lesson: 'TÜRK DİLİ VE EDEBİYATI', location: 'Salı' },
        { time: '09:40 - 10:20', lesson: 'MATEMATİK', location: 'Salı' },
        { time: '10:30 - 11:10', lesson: 'MATEMATİK', location: 'Salı' },
        { time: '11:30 - 12:10', lesson: 'ALMANCA', location: 'Salı' },
        { time: '13:00 - 13:40', lesson: 'ALMANCA', location: 'Salı' },
        { time: '13:50 - 14:30', lesson: 'İNGİLİZCE', location: 'Salı' },
        { time: '14:40 - 15:20', lesson: 'İNGİLİZCE', location: 'Salı' }
    ],
    'Çarşamba': [
        { time: '08:00 - 08:40', lesson: 'TARİH', location: 'Çarşamba' },
        { time: '08:50 - 09:30', lesson: 'TARİH', location: 'Çarşamba' },
        { time: '09:40 - 10:20', lesson: 'TÜRK DİLİ VE EDEBİYATI', location: 'Çarşamba' },
        { time: '10:30 - 11:10', lesson: 'TÜRK DİLİ VE EDEBİYATI', location: 'Çarşamba' },
        { time: '11:30 - 12:10', lesson: 'TEMEL DİNİ BİLGİLER', location: 'Çarşamba' },
        { time: '13:00 - 13:40', lesson: 'BİLİŞİM TEKNOLOJİLERİ', location: 'Çarşamba' },
        { time: '13:50 - 14:30', lesson: 'MATEMATİK', location: 'Çarşamba' },
        { time: '14:40 - 15:20', lesson: 'MATEMATİK', location: 'Çarşamba' }
    ],
    'Perşembe': [
        { time: '08:00 - 08:40', lesson: 'GÖRSEL SANATLAR', location: 'Perşembe' },
        { time: '08:50 - 09:30', lesson: 'GÖRSEL SANATLAR', location: 'Perşembe' },
        { time: '09:40 - 10:20', lesson: 'TÜRK DİLİ VE EDEBİYATI', location: 'Perşembe' },
        { time: '10:30 - 11:10', lesson: 'FİZİK', location: 'Perşembe' },
        { time: '11:30 - 12:10', lesson: 'FİZİK', location: 'Perşembe' },
        { time: '13:00 - 13:40', lesson: 'REHBERLİK', location: 'Perşembe' },
        { time: '13:50 - 14:30', lesson: 'DİN KÜLTÜRÜ', location: 'Perşembe' },
        { time: '14:40 - 15:20', lesson: 'DİN KÜLTÜRÜ', location: 'Perşembe' }
    ],
    'Cuma': [
        { time: '08:00 - 08:40', lesson: 'COĞRAFYA', location: 'Cuma' },
        { time: '08:50 - 09:30', lesson: 'COĞRAFYA', location: 'Cuma' },
        { time: '09:40 - 10:20', lesson: 'BİYOLOJİ', location: 'Cuma' },
        { time: '10:30 - 11:10', lesson: 'BİYOLOJİ', location: 'Cuma' },
        { time: '11:30 - 12:10', lesson: 'MATEMATİK', location: 'Cuma' },
        { time: '12:15 - 12:55', lesson: 'MATEMATİK', location: 'Cuma' },
        { time: '13:50 - 14:30', lesson: 'ALMANCA', location: 'Cuma' },
        { time: '14:35 - 15:15', lesson: 'ALMANCA', location: 'Cuma' }
    ]
};

const monthNames = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
