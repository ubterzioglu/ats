const EN = `a about above after again against all also am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves us it's we're you'll able across among around become becomes been being else ever every get gets got however into itself like made make many may might must need needs new non one per said say see seen shall since still take taken thus upon use used using want way well within would year years`;

const DE = `aber alle allem allen aller alles als also am an ander andere anderem anderen anderer anderes auch auf aus bei bin bis bist da damit dann der den des dem die das dass derselbe denn dazu dein deine dem den der des dessen dich dir du durch ein eine einem einen einer eines er es euch euer eure fur für gegen gewesen hab habe haben hat hatte hatten hier hin hinter ich ihr ihre ihrem ihren ihrer ihres im in indem ins ist jede jedem jeden jeder jedes jene jetzt kann kein keine konnen können machen man manche mein meine mit muss musste nach nicht nichts noch nun nur ob oder ohne sehr sein seine seinem seinen seiner seines selbst sich sie sind so solche soll sollte sondern sonst uber über um und uns unse unser unter viel vom von vor wahrend während war waren warst was weg weil weiter welche wenn werde werden wie wieder will wir wird wirst wo wollen wollte wurde wurden zu zum zur zwar zwischen sowie sowohl bzw ggf etc bzw`;

const TR = `acaba ama ancak artik artık asla aslinda aslında az bana bazen bazi bazı belki ben benden beni benim beri bile bir biraz birazi birazı biri birkac birkaç birsey birşey biz bizden bize bizi bizim bu buna bunda bundan bunlar bunlari bunları bunlarin bunların bunu bunun burada cok çok cunku çünkü da daha de defa degil değil diger diğer diye dolayi dolayı edecek eden ederek edilecek ediliyor edilmesi ediyor eger eğer en fakat gibi hala hangi hatta hem henuz henüz hep hepsi her herhangi hersey herşey hic hiç icin için ile ise itibaren iyi kadar karsin karşın kendi kendilerine kendini kendisi kendisine kendisini kez ki kim kimden kime kimi kimse mi mu mü misin nasil nasıl ne neden nedenle nerde nerede nereye niye niçin o olan olarak oldu olduklarini olduklarını oldugu olduğu oldugunu olduğunu olmadi olmadı olmak olmasi olması olmaz olsa olsun olup olur olursa oluyor ona ondan onlar onlardan onlari onları onlarin onların onu onun oysa ragmen rağmen sadece sanki sen senden seni senin siz sizden size sizi sizin sonra su şu suna şuna sunda şunda sundan şundan sunlari şunları sunu şunu tarafindan tarafından tum tüm ust üst uzere üzere var vardi vardı ve veya veyahut ya yani yapacak yapilan yapılan yapilmasi yapılması yapiyor yapıyor yapmak yaptigi yaptığı yaptiklari yaptıkları yerine yine yoksa yukarı zaten`;

const GENERIC_JOB_NOISE = `job role position candidate applicant applicants company team teams work working experience years required requirements requirement responsibilities responsibility responsible qualifications qualification skills skill knowledge ability abilities strong good excellent great plus preferred nice must should will you your we our us offer offers benefits salary apply application environment opportunity opportunities please contact send email cv resume stelle stellenangebot bewerbung bewerber kenntnisse erfahrung jahre aufgaben profil wir dich sie bieten suchen ihre unsere pozisyon aday sirket şirket ekip deneyim yil yıl gereksinim sorumluluk beceri bilgi tecrube tecrübe ariyoruz arıyoruz`;

function toSet(source: string): ReadonlySet<string> {
  return new Set(source.split(/\s+/).filter(Boolean));
}

export const STOPWORDS_EN = toSet(EN);
export const STOPWORDS_DE = toSet(DE);
export const STOPWORDS_TR = toSet(TR);
export const JOB_POSTING_NOISE = toSet(GENERIC_JOB_NOISE);

export const ALL_STOPWORDS: ReadonlySet<string> = new Set([
  ...STOPWORDS_EN,
  ...STOPWORDS_DE,
  ...STOPWORDS_TR
]);

export function isStopword(token: string): boolean {
  return ALL_STOPWORDS.has(token);
}

export function isJobNoise(token: string): boolean {
  return JOB_POSTING_NOISE.has(token);
}
