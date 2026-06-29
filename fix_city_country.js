const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace PAKISTANI_CITIES with CITIES_BY_COUNTRY
content = content.replace(
  "const PAKISTANI_CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad','Bahawalpur','Sargodha','Sukkur','Larkana','Sheikhupura','Jhang','Rahim Yar Khan','Gujrat','Kasur','Mardan','Mingora','Dera Ghazi Khan','Nawabshah','Sahiwal','Mirpur Khas','Okara','Chiniot','Kamoke','Other'];\n\n",
  "const CITIES_BY_COUNTRY: Record<string, string[]> = {\n  'Pakistan': ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Abbottabad','Bahawalpur','Sargodha','Sukkur','Larkana','Sheikhupura','Rahim Yar Khan','Gujrat','Sahiwal','Okara','Other'],\n  'United States': ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Other'],\n  'United Kingdom': ['London','Birmingham','Manchester','Leeds','Glasgow','Liverpool','Bristol','Sheffield','Edinburgh','Cardiff','Other'],\n  'United Arab Emirates': ['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain','Other'],\n  'Saudi Arabia': ['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Tabuk','Buraidah','Other'],\n  'India': ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Surat','Other'],\n  'Canada': ['Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg','Quebec City','Other'],\n  'Australia': ['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Canberra','Other'],\n};\n\n"
);

// Update city dropdown to use CITIES_BY_COUNTRY based on selected country
content = content.replace(
  '<select value={PAKISTANI_CITIES.includes(form.city) ? form.city : form.city ? "Other" : ""} onChange={e => setForm({...form, city: e.target.value === "Other" ? "" : e.target.value})} className={inputClass("city")}><option value="">Select city</option>{PAKISTANI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>{(!PAKISTANI_CITIES.includes(form.city) || form.city === "") && form.city !== "" && <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Enter city name" className={inputClass("city") + " mt-2"} />}',
  '{(() => { const cities = CITIES_BY_COUNTRY[form.country] || []; return cities.length > 0 ? (<><select value={cities.includes(form.city) ? form.city : form.city ? "Other" : ""} onChange={e => setForm({...form, city: e.target.value === "Other" ? "" : e.target.value})} className={inputClass("city")}><option value="">Select city</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select>{!cities.includes(form.city) && form.city !== "" && <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Enter city name" className={inputClass("city") + " mt-2"} />}</>) : (<input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Enter city name" className={inputClass("city")} />); })()}'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');