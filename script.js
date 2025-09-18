// DOM Elements
const form = document.getElementById('absensiForm');
const statusDiv = document.getElementById('status');
const locationSpan = document.getElementById('currentLocation');

// Simpan data absensi ke local (untuk sementara)
let absensiList = JSON.parse(localStorage.getItem('marchingband_absensi')) || [];

// Ambil lokasi saat ini (GPS)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // Gunakan reverse geocoding (gunakan API geocoding gratis dari Nominatim)
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const lokasi = data.display_name || "Lokasi tidak ditemukan";
          locationSpan.textContent = lokasi;
          console.log("Lokasi berhasil didapatkan:", lokasi);
        })
        .catch(err => {
          locationSpan.textContent = "Tidak bisa mendapatkan lokasi";
          console.error("Error geocoding:", err);
        });
    },
    (err) => {
      locationSpan.textContent = "GPS tidak aktif atau ditolak";
      console.warn("GPS Error:", err.message);
    }
  );
} else {
  locationSpan.textContent = "Browser tidak mendukung GPS";
}

// Proses submit form
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const photoInput = document.getElementById('photo');
  const photoFile = photoInput.files[0];

  if (!name || !photoFile) {
    statusDiv.innerHTML = '<span style="color: #ff6b6b;">❌ Silakan isi semua bagian!</span>';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const photoBase64 = reader.result;

    const absensi = {
      nama: name,
      foto: photoBase64,
      lokasi: locationSpan.textContent,
      tanggal: new Date().toLocaleString('id-ID'),
    };

    absensiList.unshift(absensi); // Simpan di awal

    // Simpan di localStorage (bisa diganti dengan penyimpanan ke file GitHub di future)
    localStorage.setItem('marchingband_absensi', JSON.stringify(absensiList));

    // Simpan ke file absensi.json (nanti kita upload ke GitHub)
    saveToLocalFile(absensiList);

    statusDiv.innerHTML = `<span style="color: #d0ff6a;">✅ Absensi berhasil! Terima kasih, ${name}!</span>`;
    form.reset();
    setTimeout(() => statusDiv.innerHTML = '', 4000);
  };
  reader.readAsDataURL(photoFile);
});

// Simpan data ke file absensi.json (untuk GitHub)
function saveToLocalFile(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'absensi.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
