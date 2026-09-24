// Konuşma kartları: bir boyutta algı farkı ya da gerilim çıktığında sonucu
// konuşmaya çevirmek için açık uçlu sorular. Suçlamayan, "ben" diliyle
// cevaplanabilen, evet/hayır'a sıkışmayan sorular — tanı ya da tavsiye değil.
//
// PULSE_QUESTIONS ile aynı desen: içerik kodda, test_id → boyut id'sine göre.
// İş ve aile testlerinde sorular iki rol (yönetici/çalışan, ebeveyn/çocuk)
// için de okunabilir olacak şekilde yazıldı.
export const CONVERSATION_PROMPTS: Record<string, Record<string, string[]>> = {
  romantic: {
    decision: [
      "Son aldığımız büyük kararı düşün: kim başlattı, son sözü kim söyledi?",
      "Hangi konularda kararı bana bırakmak seni rahatlatıyor, hangilerinde dışarıda kalmış hissediyorsun?",
      "Bir karar üzerinde anlaşamadığımızda genelde nasıl sonuçlanıyor? Bu yöntem ikimize de adil geliyor mu?",
    ],
    domestic: [
      "Evde en çok hangi iş görünmeden yapılıyor sence?",
      "Hangi ev işini hiç sevmiyorsun, hangisini yapmak sana zor gelmiyor?",
      "Önümüzdeki bir hafta iş bölümünü baştan yazsaydık neyi değiştirirdik?",
    ],
    mental: [
      "Aklında tuttuğun ama benim fark etmediğimi düşündüğün bir şey var mı? (randevular, alışveriş, doğum günleri...)",
      "Bir şeyi 'hatırlamak' zorunda olmak sana nasıl hissettiriyor?",
      "Planlama yükünün bir kısmını tamamen devretmek istesen hangisi olurdu?",
    ],
    digital: [
      "Faturalar, abonelikler, rezervasyonlar gibi ekran başında yapılan işlerin çoğunu kim üstleniyor?",
      "Bu işlerden hangisi sana görünmez bir emek gibi geliyor?",
      "Hangi dijital işi ortak bir düzene (hatırlatıcı, ortak liste) bağlayabiliriz?",
    ],
    social: [
      "Kendi arkadaşlarınla ya da tek başına geçirdiğin zaman sana yetiyor mu?",
      "Ben ayrı bir plan yaptığımda içinden ne geçiyor?",
      "Birbirimizin sosyal alanına ne kadar karışmak bize iyi geliyor?",
    ],
    family: [
      "Ailelerimizin kararlarımıza en çok karıştığı konu hangisi?",
      "Ailen hakkında konuşurken kendini hangi durumda sıkışmış hissediyorsun?",
      "Ailelerimize karşı ortak bir sınır koymak istesek bu ne olurdu?",
    ],
  },
  friendship: {
    initiative: [
      "Görüşmeleri çoğunlukla kim başlatıyor sence? Bu sana nasıl hissettiriyor?",
      "Bir süre ses çıkmadığında bunu nasıl yorumluyorsun?",
      "Birbirimizi daha kolay arayabilmek için neyi değiştirebiliriz?",
    ],
    effort: [
      "Arkadaşlığımızda en çok kimin zamanına ve planına göre hareket ediyoruz?",
      "Senin için bir şey yapmak için uğraştığımı en son ne zaman hissettin?",
      "Emek dengesi senin için eşit olmak zorunda mı, yoksa dönemsel olarak değişebilir mi?",
    ],
    emotional: [
      "Zor bir dönemde beni aramak senin için kolay mı?",
      "Bir derdini anlattığında en çok ne duymak istiyorsun: çözüm mü, dinlenmek mi?",
      "Seni gerçekten anladığımı hissettiğin bir anı hatırlıyor musun?",
    ],
    practical: [
      "Benden yardım istemek sana ne kadar kolay geliyor?",
      "Birbirimize yaptığımız somut iyilikler dengeli mi sence?",
      "Hangi konuda birbirimize daha çok destek olabiliriz?",
    ],
    honesty: [
      "Sana kırıldığımı söylesem bunu nasıl duymak isterdin?",
      "Aramızda hiç konuşulmamış küçük bir kırgınlık var mı?",
      "Bir anlaşmazlıktan sonra genelde kim ilk adımı atıyor?",
    ],
    autonomy: [
      "Başka arkadaşlıklarım ya da yoğun dönemlerim seni nasıl etkiliyor?",
      "Arkadaşlığımızda hiç kendini 'fazla' ya da 'eksik' hissettiğin oldu mu?",
      "Birbirimizin alanına saygıyı nasıl gösterdiğimizi düşünüyorsun?",
    ],
  },
  family: {
    decision: [
      "Seni doğrudan ilgilendiren son kararda sözün ne kadar geçti?",
      "Hangi konularda kararı birlikte almak bize daha iyi gelirdi?",
      "Fikirlerimiz ayrıldığında son kararı kimin verdiğini nasıl belirliyoruz?",
    ],
    listening: [
      "Bir şey anlattığında dinlendiğini en çok ne zaman hissediyorsun?",
      "Sözünün kesildiğini ya da geçiştirildiğini hissettiğin bir an var mı?",
      "Birbirimizi daha iyi dinlemek için neyi farklı yapabiliriz?",
    ],
    emotionalLabour: [
      "Ailede moral bozukluğunu en çok kim toparlıyor sence?",
      "Senin zor anlarında destek isteyebildiğin kişi kim?",
      "Birbirimize duygusal olarak daha çok ne zaman ihtiyaç duyuyoruz?",
    ],
    practicalSupport: [
      "Zaman, para ya da iş gücü gibi somut yardımlar aramızda nasıl dağılıyor?",
      "Yaptığın bir yardımın fark edilmediğini hissettiğin oldu mu?",
      "Önümüzdeki dönemde birbirimize hangi somut konuda destek olabiliriz?",
    ],
    trust: [
      "Kendini hangi durumlarda kontrol edilmiş hissediyorsun?",
      "Güvenimizi gösterdiğimiz küçük şeyler neler?",
      "Endişe ile kontrol arasındaki çizgiyi nerede görüyorsun?",
    ],
    privacy: [
      "Kendine ait tutmak istediğin bir alan (oda, telefon, zaman) korunuyor mu?",
      "Mahremiyetine saygı gösterildiğini en son ne zaman hissettin?",
      "Birbirimizden neyi sormadan bilmemek bize iyi gelir?",
    ],
  },
  work: {
    decision: [
      "Son ekip kararında görüşün alındığını hissettin mi?",
      "Hangi kararlarda daha erken sürece dahil olmak işe yarardı?",
      "Karar bir kez verildikten sonra itiraz etmek ne kadar mümkün?",
    ],
    feedback: [
      "Geri bildirim sadece bir yönde mi akıyor sence?",
      "En son aldığın faydalı geri bildirim neydi ve nasıl verilmişti?",
      "Karşı tarafa zor bir geri bildirimi rahatça verebilmek için neye ihtiyaç var?",
    ],
    workload: [
      "Şu anki iş yükü dağılımı sana adil geliyor mu?",
      "Görünmeyen ama zaman alan hangi işleri üstleniyorsun?",
      "Yük arttığında önceliklendirmeyi birlikte nasıl yapabiliriz?",
    ],
    recognition: [
      "Katkının en son ne zaman fark edildiğini hissettin?",
      "Takdir senin için en çok hangi biçimde anlam taşıyor?",
      "Hangi emek fark edilmeden kalıyor sence?",
    ],
    trust: [
      "İşin takip ediliş biçimi sana güven mi, kontrol mü hissettiriyor?",
      "Daha fazla alan tanınsa neyi farklı yapardın?",
      "Güvenin sarsıldığı bir anı konuşmaya açık mıyız?",
    ],
    boundaries: [
      "Mesai dışında gelen mesajlar sende nasıl bir beklenti yaratıyor?",
      "Kişisel zamanının korunduğunu hissediyor musun?",
      "Acil durum ile beklemesi mümkün iş arasındaki çizgiyi birlikte nasıl çizebiliriz?",
    ],
  },
  roommate: {
    chores: [
      "Evde en çok hangi iş aksıyor ve kimin üzerinde kalıyor?",
      "Hangi işi yapmayı sevmiyorsun, hangisini severek üstlenirsin?",
      "Bir haftalık iş bölümü listesi yapsak neler olurdu?",
    ],
    expenses: [
      "Ortak giderlerin bölüşümü sana adil geliyor mu?",
      "Para konusunu açmak senin için ne kadar kolay?",
      "Ortak alışverişleri takip etmek için basit bir yöntem bulabilir miyiz?",
    ],
    standards: [
      "Senin için 'temiz ve düzenli' ne demek?",
      "Beklentilerimiz en çok hangi alanda ayrışıyor (mutfak, banyo, salon)?",
      "İkimizin de yaşayabileceği ortak bir asgari düzen ne olurdu?",
    ],
    communication: [
      "Bir şey seni rahatsız ettiğinde bunu söylemek mi, geçiştirmek mi daha kolay?",
      "Sorunları not, mesaj ya da yüz yüze, hangi yolla konuşmayı tercih edersin?",
      "Küçük sorunlar büyümeden konuşmak için bir rutin kurabilir miyiz?",
    ],
    guests: [
      "Misafir gelmeden önce ne kadar önceden haber almak istersin?",
      "Ortak alanları kullanırken seni en çok ne rahatsız ediyor?",
      "Misafir ve ortak alan için birkaç basit kural koysak ne olurdu?",
    ],
    privacy: [
      "Sessizliğe en çok hangi saatlerde ihtiyacın var?",
      "Eşyalarına ya da odana saygı gösterildiğini hissediyor musun?",
      "Evde tek başına kalma ihtiyacını nasıl dile getirmek istersin?",
    ],
  },
};

export function getConversationPrompts(testId: string): Record<string, string[]> {
  return CONVERSATION_PROMPTS[testId] ?? {};
}
