PidatoPro — Teleprompter Pidato Teks Berjalan
Aplikasi teleprompter pidato berbasis web. Teks berjalan dari bawah ke atas, jadi kamu tinggal membaca. Dilengkapi template pidato siap pakai dalam berbagai bahasa, dan bisa tempel teks pidato sendiri.

Fitur Utama
Teleprompter
Teks berjalan otomatis dari bawah ke atas
Hitungan mundur 3 - 2 - 1 sebelum teks jalan
Setelah hitungan selesai, teks langsung jalan sendiri tanpa tekan tombol lagi
Tombol Play / Jeda sinkron otomatis dengan status teks
Slider kecepatan 0.25x - 2x, semua kecepatan jalan halus:
0.25 = sangat pelan
0.5 = pelan
0.75 = pelan
1.00 = normal
1.5 = cepat
2.0 = sangat cepat
Kecepatan bisa digeser saat teks sedang jalan, langsung terasa tanpa restart
Jeda lalu Play lagi lanjut dari posisi terakhir, tidak lompat
Template Pidato Siap Pakai
Satu dropdown Template Pidato
Grup template bisa dibuka / ditutup (collapsible)
Urutan tiap kolom konsisten: Indonesia, English, Mandarin
Kategori: Pernikahan, Wisuda, Kemerdekaan, Motivasi, Doa, Adat, dan lainnya
Bahasa Daerah (sebelum Doa) — berisi Pernikahan dan Adat:
Jawa, Sunda, Batak, Aceh, Banjar, Madura, dan lainnya
Tempel Teks Sendiri
Form Tambah Pidato halaman penuh, satu scroll saja
Field:
Judul — judul pidato kamu
Acara — teks bebas, kosong, tidak terkunci ke acara tertentu
Teks Pidato — tempel / ketik teks pidato
Teks yang ditempel tidak jadi template di halaman depan
Riwayat hanya di dalam form, ada tombol Hapus / Simpan
Yang disimpan muncul di grup paling bawah: Tersimpan / Riwayat Tersimpan
Tampilan
Tema warna: Ungu, Biru, Hijau, Orange, Pink, Hitam, Coklat / Krem
Warna mengubah tombol + aksen di seluruh aplikasi, tersimpan otomatis
Tema Hitam tombolnya benar-benar hitam dengan teks putih terbaca
Tombol modern bentuk pill + glassmorphism
Header PidatoPro tetap nempel di atas saat scroll, kartu hilang rapi di belakangnya
Panah scroll ke atas di pojok kanan bawah:
Bodi tipis 1px saja
Border + ikon panah mengikuti warna dasar / tema aktif
Tidak tebal, tidak mengganggu
Responsif di HP dan desktop
Mandarin
Toggle ukuran font berpengaruh ke teks Mandarin
Font Mandarin 0.65x dari Latin supaya tidak terpotong
Ada level Sangat Kecil
Tidak terpotong acak di tengah kalimat
Cara Pakai (Untuk Pengguna)
Buka aplikasi PidatoPro
Pilih template di Template Pidato, atau tekan + Tambah Pidato untuk tempel teks sendiri
Tekan Mulai
Tunggu hitungan 3 - 2 - 1
Teks langsung jalan sendiri — kamu tinggal membaca
Atur kecepatan dengan slider kalau terlalu cepat / pelan
Tekan Jeda kalau mau berhenti sebentar, tekan Play untuk lanjut
Cara Jalan di Local / VS Code
Proyek ini adalah aplikasi web statis (HTML, CSS, JS). Tidak perlu install rumit.

Struktur Folder
pidatopro/
├── index.html              # Halaman utama
├── style.css               # Styling, tema warna, glassmorphism
├── script.js               # Logika teleprompter, kecepatan, countdown, toggle
├── templates/
│   ├── indonesia.js        # Template Bahasa Indonesia
│   ├── english.js          # Template Bahasa Inggris
│   ├── mandarin.js         # Template Mandarin
│   └── daerah.js           # Template Bahasa Daerah (Jawa, Sunda, dll)
├── assets/
│   └── images/             # Gambar / ikon (jika ada)
├── README.md               # File ini
└── LICENSE                 # Lisensi MIT

Cara Edit Template
Template pidato disimpan sebagai data (array / object) di file JS.

Contoh menambah template baru:

{
  judul: "Pidato Pernikahan",
  acara: "Pernikahan",
  bahasa: "Indonesia",
  teks: "Assalamualaikum warahmatullahi wabarakatuh..."
}
Aturan yang dipakai di proyek ini:

Tiap acara / kolom harus ada urutan: Indonesia, English, Mandarin
Bahasa Daerah ditaruh sebelum Doa, hanya untuk acara Pernikahan dan Adat
Jangan ubah template bawaan jadi teks tempelan pengguna
Logika Teleprompter (Untuk Developer)
Alur yang dipakai supaya tidak stuck:

Tekan Mulai
  -> state = countdown
  -> hitungan 3 - 2 - 1
  -> hitungan selesai
  -> state = isPlaying = true
  -> loop scroll dimulai
Perhitungan kecepatan (anti-stuck):

// Jangan pakai Math.floor / Math.round per frame
// Posisi disimpan sebagai float
let pos = 0;
let lastTime = performance.now();

function loop(now) {
  const dt = (now - lastTime) / 1000; // detik
  lastTime = now;
  pos += speed * pixelsPerSecond * dt;
  textElement.style.transform = `translateY(${-pos}px)`;
  if (isPlaying) requestAnimationFrame(loop);
}
Kenapa pakai cara ini:

scrollTop integer membulatkan gerakan < 1px jadi 0 -> kecepatan pelan (0.25 - 0.75) stuck
translateY + posisi float membuat gerakan di bawah 1px tetap terlihat
deltaTime membuat kecepatan konsisten di HP / laptop mana pun
Satu state isPlaying saja supaya ikon Play / Jeda selalu sinkron
Checklist Kualitas
 Header fixed, kartu hilang rapi di belakang header
 Countdown 3-2-1 -> teks langsung jalan otomatis
 Kecepatan 0.25 - 2x semua jalan, tidak stuck
 Toggle Play / Jeda sinkron otomatis
 Slider kecepatan live tanpa restart
 Tema warna tersimpan otomatis, tema Hitam benar-benar hitam
 Panah scroll ke atas tipis 1px, ikut warna dasar
 Form Tambah Pidato satu scroll, tanpa double scrollbar
 Template urutan Indonesia, English, Mandarin
 Bahasa Daerah sebelum Doa, hanya Pernikahan + Adat
 Teks tempelan tidak jadi template depan
 Responsif HP + desktop, tidak ada elemen terpotong
Kontribusi
Fork repo ini
Buat branch baru: git checkout -b fitur-baru
Commit: git commit -m "Tambah fitur X"
Push: git push origin fitur-baru
Buat Pull Request
Lisensi
Proyek ini dirilis di bawah lisensi MIT. Bebas dipakai, diubah, dan dibagikan dengan menyertakan lisensi.

Kontak
Kalau ada bug / saran fitur, buat Issue di repo GitHub ini.

Dibuat untuk membantu siapa pun yang mau pidato dengan percaya diri — tinggal baca, teksnya jalan sendiri.
