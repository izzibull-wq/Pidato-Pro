import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Play, Plus, X, FlipHorizontal2 as MirrorIcon, Maximize, RotateCcw, Pause, Clock, Mic, ChevronDown, BookOpen, Eye, Check, Palette, MousePointerClick, LayoutTemplate, Trash2, Pencil, ArrowUp } from 'lucide-react';

type Speech = { id:string; title:string; subtitle?:string; language:string; event:string; text:string; builtin:boolean; recordId?:string; once?:boolean; created_at?:string };
type Draft = { title:string; event:string; text:string };

const DISPLAY_LANGUAGE_MAP:Record<string,string>={'Indonesia':'🇮🇩 Indonesia - Bahasa Indonesia','English':'🇬🇧 English - Bahasa Inggris','Jawa':'🇮🇩 Jawa - Basa Jawa','Sunda':'🇮🇩 Sunda - Basa Sunda','Mandarin / 中文':'🇨🇳 Mandarin - 中文 (Bahasa Mandarin)'};
function displayLanguage(lang:string){return DISPLAY_LANGUAGE_MAP[lang]||lang}
function isCjk(t:string){return /[\u4e00-\u9fff]/.test(t)}
function cjkRatio(t:string){const chars=t.replace(/\s/g,'');if(!chars) return 0;const cjk=(chars.match(/[\u4e00-\u9fff]/g)||[]).length;return cjk/chars.length}
function isCjkHeavy(t:string){return cjkRatio(t)>0.3}
function detectLanguageLabel(text:string):string{
  if(isCjk(text)) return 'Mandarin / 中文';
  const lower=text.toLowerCase();
  const englishWords=[' the ',' and ',' you ',' your ',' thank ',' today ',' this ',' that ',' with ',' from ',' love ',' life ',' future ',' dream ',' success ',' friends ',' family ',' school ',' welcome ',' good ',' great ',' never ',' always ',' every ',' will ',' have ',' been ',' because ',' about ',' people ',' world '];
  const indonesianWords=[' dan ',' yang ',' untuk ',' dengan ',' dari ',' adalah ',' kita ',' kami ',' saya ',' anda ',' kamu ',' terima ',' kasih ',' hari ',' ini ',' itu ',' dalam ',' pada ',' telah ',' akan ',' tidak ',' juga ',' lebih ',' karena ',' tentang ',' semua ',' hidup ',' masa ',' depan ',' mimpi ',' sukses ',' teman ',' keluarga ',' sekolah ',' selamat ',' jangan ',' selalu ',' setiap ',' mari ',' bahwa ',' oleh ',' kepada '];
  const count=(words:string[])=>words.reduce((n,w)=>n+(lower.includes(w)?1:0),0);
  const en=count(englishWords);
  const id=count(indonesianWords);
  if(en>=3 && en>id) return 'English';
  if(id>=2 && id>=en) return 'Indonesia';
  if(en>0 && id===0 && en>=2) return 'English';
  return 'Teks';
}
function effectiveLanguage(s:Speech){
  if(s.language) return displayLanguage(s.language);
  const detected=detectLanguageLabel(s.text);
  return detected==='Teks' ? 'Teks' : displayLanguage(detected);
}
function isMandarinLang(lang:string){return displayLanguage(lang).includes('Mandarin')}
function speechIsMandarin(s:Speech){return isMandarinLang(s.language)||isCjk(s.text)}
const EVENTS=['Semua','Kemerdekaan','Wisuda','Pernikahan','Sekolah','Perusahaan','Perpisahan','Motivasi','Ulang Tahun'];
const GROUP_ORDER=['Kemerdekaan','Wisuda','Pernikahan','Bahasa Daerah','Doa','Sambutan','Sekolah','Perusahaan','Perpisahan','Motivasi','Ulang Tahun'];
function languageRank(s:Speech){
  const lang=(s.language||'').toLowerCase();
  if(lang.includes('indonesia')) return 0;
  if(lang.includes('english')) return 1;
  if(lang.includes('mandarin')||lang.includes('中文')||isCjk(s.text)) return 2;
  const detected=detectLanguageLabel(s.text);
  if(detected==='Indonesia') return 0;
  if(detected==='English') return 1;
  if(detected==='Mandarin / 中文') return 2;
  return 3;
}
function regionalSubgroup(s:Speech){ return (s.event||'').trim().toLowerCase()==='pernikahan' ? 'Pernikahan' : 'Adat'; }
const REGIONAL_KEYWORDS=['jawa','sunda','bali','bugis','minang','minangkabau','batak','madura','aceh','banjar','sasak','makassar','gorontalo','lampung','nias','mentawai','dayak','kutai','toraja','minahasa','manado','ambon','maluku','papua','flores','timor','sumba','sumbawa','bima','gayo','karo','toba','simalungun','mandailing','rejang','komering','palembang','betawi','osing','tengger','baduy','cirebon','banten','dani','asmat','biak','sentani','tobelo','ternate','tidore','seram','buru','talaud','sangihe','halmahera','banggai','buton','muna','tolaki','kaili','pamona','mori','poso','wolio'];
function isRegionalSpeech(s:Speech){
  const hay=`${s.language||''} ${s.event||''} ${s.title||''} ${s.subtitle||''}`.toLowerCase();
  if(/\bbahasa\s+daerah\b/.test(hay)) return true;
  return REGIONAL_KEYWORDS.some(k=>new RegExp(`\\b${k}\\b`).test(hay));
}
function groupKeyFor(s:Speech){ return isRegionalSpeech(s)?'Bahasa Daerah':((s.event||'Lainnya').trim()||'Lainnya'); }
function groupOrderIndex(name:string){ const i=GROUP_ORDER.indexOf(name); return i===-1?999:i; }

type Theme = { id:string; name:string; primary:string; primary2:string; soft:string; line:string; paper:string; surface:string; surface2:string; ink:string; muted:string };
const THEMES:Theme[]=[
{id:'ungu',name:'Ungu',primary:'#6d28d9',primary2:'#4c1d95',soft:'#f1edfb',line:'#e7e0f4',paper:'#fbf9ff',surface:'#ffffff',surface2:'#f1edfb',ink:'#17131f',muted:'#6e657f'},
{id:'biru',name:'Biru',primary:'#1d4ed8',primary2:'#1e40af',soft:'#e8efff',line:'#dbe4ff',paper:'#f7faff',surface:'#ffffff',surface2:'#e8efff',ink:'#131a2a',muted:'#5d6a85'},
{id:'hijau',name:'Hijau',primary:'#15803d',primary2:'#166534',soft:'#e8f7ee',line:'#d6ecd9',paper:'#f7fbf7',surface:'#ffffff',surface2:'#e8f7ee',ink:'#13251a',muted:'#56705f'},
{id:'oranye',name:'Oranye',primary:'#ea580c',primary2:'#c2410c',soft:'#fff0e6',line:'#ffe0c9',paper:'#fffaf5',surface:'#ffffff',surface2:'#fff0e6',ink:'#2a1a10',muted:'#7a6552'},
{id:'pink',name:'Merah Muda / Pink',primary:'#db2777',primary2:'#be185d',soft:'#fdeef6',line:'#fbd9e9',paper:'#fdf7fa',surface:'#ffffff',surface2:'#fdeef6',ink:'#2a1420',muted:'#7c5a6d'},
{id:'hitam',name:'Hitam / Gelap',primary:'#64748b',primary2:'#475569',soft:'#26262b',line:'#3a3a41',paper:'#111111',surface:'#1c1c1e',surface2:'#2a2a2e',ink:'#f8f8f8',muted:'#b8b8c0'},
{id:'coklat',name:'Coklat / Krem',primary:'#8b5a2b',primary2:'#6b4420',soft:'#f7eee2',line:'#e8d9c3',paper:'#fbf6ee',surface:'#fffdf8',surface2:'#f7eee2',ink:'#2b1d12',muted:'#7a6a58'},
];
function themeVars(t:Theme){ return {'--primary':t.primary,'--primary-2':t.primary2,'--surface-2':t.surface2,'--line':t.line,'--paper':t.paper,'--surface':t.surface,'--ink':t.ink,'--muted':t.muted} as React.CSSProperties; }

const BUILTIN:Speech[]=[
{id:'kemerdekaan',title:'Pidato Kemerdekaan: Indonesia Merdeka, Indonesia Maju',language:'Indonesia',event:'Kemerdekaan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Salam sejahtera untuk kita semua, Shalom, Om Swastiastu, Namo Buddhaya, Salam Kebajikan.

Yang saya hormati, hadirin yang berbahagia. Hari ini, 17 Agustus, kita kembali memperingati hari yang paling bersejarah bagi bangsa ini. Delapan puluh satu tahun yang lalu, para pendiri bangsa dengan keberanian luar biasa memproklamasikan kemerdekaan Indonesia.

Kemerdekaan itu tidak datang begitu saja. Ia ditebus dengan darah, air mata, dan pengorbanan yang tak terhitung. Dari Sabang sampai Merauke, dari para pejuang di medan perang hingga ibu-ibu yang merelakan anaknya berjuang, semua bersatu untuk satu kata: Merdeka!

Hari ini, tugas kita berbeda, tetapi semangatnya sama. Jika dulu kita berjuang mengusir penjajah, hari ini kita berjuang melawan kemiskinan, kebodohan, dan perpecahan. Kita berjuang untuk membuat Indonesia maju, adil, dan sejahtera untuk semua.

Mari kita isi kemerdekaan ini dengan karya nyata. Belajar lebih giat, bekerja lebih jujur, dan saling menghargai dalam perbedaan. Karena Indonesia yang besar hanya bisa dibangun oleh rakyat yang bersatu.

Dirgahayu Republik Indonesia! Merdeka! Merdeka! Merdeka!

Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'kemerdekaan-en',title:'Independence Speech: Indonesia Free, Indonesia Forward',language:'English',event:'Kemerdekaan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Peace be upon you all, Shalom, Om Swastiastu, Namo Buddhaya, Greetings of Virtue.

Distinguished guests, everyone here today. Today, on the 17th of August, we once again commemorate the most historic day for our nation. Eighty-one years ago, the founders of this nation, with extraordinary courage, proclaimed the independence of Indonesia.

Independence did not come on its own. It was redeemed with blood, tears, and countless sacrifices. From Sabang to Merauke, from the fighters on the battlefield to the mothers who let their children go to fight, all were united by one word: Free!

Today, our task is different, but the spirit is the same. If in the past we fought to drive out the colonisers, today we fight against poverty, ignorance, and division. We fight to make Indonesia advanced, fair, and prosperous for all.

Let us fill this independence with real work. Study harder, work more honestly, and respect one another in our differences. Because a great Indonesia can only be built by a united people.

Long live the Republic of Indonesia! Free! Free! Free!

Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'kemerdekaan-zh',title:'独立演讲：印度尼西亚自由，印度尼西亚前进',subtitle:'Pidato Kemerdekaan - Indonesia Merdeka, Indonesia Maju',language:'Mandarin / 中文',event:'Kemerdekaan',builtin:true,text:`尊敬的各位来宾，大家好。今天，8月17日，我们再次纪念我们民族历史上最重要的一天。八十一年前，我们的建国先辈以非凡的勇气宣布印度尼西亚独立。独立不是白白得来的。它是用鲜血、眼泪和数不清的牺牲换来的。从沙璜到马老奇，从战场上的战士，到送孩子上战场母亲，所有人为了一个词而团结在一起：自由！今天，我们的任务不同了，但精神是一样的。如果过去我们为赶走殖民者而奋斗，今天我们要为战胜贫困、无知和分裂而奋斗。我们要为建设一个先进、公正、繁荣的印度尼西亚而奋斗。让我们用实际行动来充实独立。更加努力学习，更加诚实工作，在差异中互相尊重。因为只有团结的人民，才能建设一个伟大的印度尼西亚。印度尼西亚共和国万岁！自由！自由！自由！谢谢大家！`},
{id:'wisuda-en',title:'Graduation Speech: The Future Is Ours',language:'English',event:'Wisuda',builtin:true,text:`Good morning, respected teachers, proud parents, and my fellow graduates.

Today is not just the end of a chapter. It is the beginning of a brand new story. Four years ago, we walked into this place as strangers, nervous, unsure, and full of questions. Today, we leave as family, stronger, wiser, and ready for the world.

We have laughed together, cried together, stayed up late for exams, and celebrated every small victory. We have learned more than just lessons from books. We learned about friendship, resilience, and believing in ourselves even when things got hard.

To our teachers, thank you. You did not just teach us subjects, you taught us how to think, how to dream, and how to never give up. To our parents, thank you for your endless sacrifice, your prayers, and your love that never ran out.

Now, the future is waiting for us. Some of us will continue studying, some will work, some will build businesses. Whatever path we choose, let us remember: success is not about being the fastest, but about never stopping.

Congratulations, Class of 2026! The future is ours. Let us make it beautiful.`},
{id:'wisuda-id',title:'Pidato Wisuda: Hari Ini Kita Lulus, Esok Kita Mengabdi',language:'Indonesia',event:'Wisuda',builtin:true,text:`Yang terhormat Bapak/Ibu Rektor, dosen, orang tua, dan teman-teman wisudawan yang saya banggakan.

Hari ini adalah hari yang kita tunggu-tunggu. Setelah bertahun-tahun berjuang, begadang, revisi, dan hampir menyerah, akhirnya kita sampai di titik ini: wisuda.

Saya masih ingat hari pertama kita masuk kampus. Semua terasa asing. Tapi waktu berjalan, dan kampus ini menjadi rumah kedua kita. Kita belajar bukan hanya ilmu, tapi juga tentang kehidupan. Tentang bagaimana bangkit setelah gagal, tentang kerja sama, dan tentang arti persahabatan yang sesungguhnya.

Kepada orang tua kami, gelar ini adalah milik kalian juga. Terima kasih atas doa yang tidak pernah putus, atas keringat dan pengorbanan yang tidak pernah kalian ceritakan. Hari ini, toga ini kita persembahkan untuk kalian.

Teman-teman, wisuda bukan akhir. Ini adalah gerbang awal. Dunia di luar sana menanti kontribusi kita. Mari kita buktikan bahwa kita bukan hanya lulusan yang pintar, tapi juga lulusan yang berakhlak, peduli, dan bermanfaat.

Selamat wisuda untuk kita semua. Semoga ilmu kita menjadi berkah.`},
{id:'nikah-id',title:'Sambutan Pernikahan: Keluarga Mempelai',language:'Indonesia',event:'Pernikahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh.

Yang saya hormati Bapak/Ibu tamu undangan, kedua mempelai yang berbahagia, dan seluruh keluarga besar.

Pertama-tama, marilah kita panjatkan puji syukur ke hadirat Allah SWT, karena atas rahmat-Nya, pada hari yang berbahagia ini kita dapat berkumpul untuk menyaksikan penyatuan dua insan dalam ikatan suci pernikahan.

Pernikahan bukan hanya tentang menyatukan dua orang, tapi menyatukan dua keluarga, dua cerita, dan dua impian menjadi satu. Ananda berdua, mulai hari ini, kalian bukan lagi dua, melainkan satu. Satu dalam suka, satu dalam duka, satu dalam membangun rumah tangga yang sakinah, mawaddah, warahmah.

Pesan kami sederhana: bangunlah rumah tangga dengan komunikasi, kesabaran, dan saling menghargai. Jangan pernah tidur dalam keadaan marah. Selalu selesaikan masalah dengan kepala dingin dan hati yang lembut.

Kepada para tamu, terima kasih atas kehadiran dan doa restu kalian. Doa kalian adalah hadiah terindah bagi kedua mempelai. Selamat menempuh hidup baru. Semoga menjadi keluarga yang bahagia hingga ke Jannah-Nya.

Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'wedding-en',title:'Wedding Speech: A Lifetime of Love',language:'English',event:'Pernikahan',builtin:true,text:`Good evening everyone, and thank you for being here to celebrate love.

When I first met these two, I knew there was something special. You could see it in the way they looked at each other. It was not just love, it was home.

Marriage is not about finding the perfect person. It is about loving an imperfect person perfectly. It is about choosing each other, every single day, even on the hard days. Especially on the hard days.

To the bride and groom: May your love grow deeper every year. May you laugh together more than you argue. May you always be each other's best friend, biggest supporter, and safest place. And may your home always be filled with warmth, laughter, and endless love.

Please raise your glasses. To love, to laughter, and to happily ever after. Cheers!`},
{id:'nikah-jawa',title:'Pidato Pambagyo Pernikahan Adat Jawa',language:'Jawa',event:'Pernikahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Sugeng rawuh, para tamu ingkang kinurmatan, pinisepuh, saha sedaya keluarga ageng.

Sepisan, sumonggo kita ngaturaken puji syukur dumateng Gusti Allah ingkang sampun paring rahmat, saengga ing dinten ingkang bagya punika kita saged kempal manunggal ing acara pawiwahan.

Pawiwahan punika boten namung nggandhengaken kekalih penganten, nanging ugi nggandhengaken kekalih kulawarga ageng dados satunggal kulawarga ingkang rukun lan guyub. Mugi-mugi kekalih penganten saged mbangun bale wisma ingkang sakinah, mawaddah, warahmah. Tansah saling asih, saling asah, lan saling asuh.

Matur nuwun dumateng sedaya tamu ingkang sampun rawuh lan paring donga pangestu. Mugi donga panjenengan dados berkah kangge kekalih penganten.

Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'nikah-sunda',title:'Sambutan Pernikahan Basa Sunda',language:'Sunda',event:'Pernikahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Wilujeng sumping ka sadaya tamu undangan, ka para sepuh, sareng ka kulawarga ageung.

Puji syukur urang panjatkeun ka Allah SWT, ku rahmat-Na urang tiasa kumpul dina acara anu bagja ieu, nyaeta nyaksian ngahijina dua insan dina ikatan suci pernikahan.

Pernikahan teh sanes ngan saukur ngahijikeun dua jalmi, tapi ngahijikeun dua kulawarga janten hiji kulawarga anu silih asih, silih asah, silih asuh. Ka panganten, mugia janten kulawarga anu sakinah, mawaddah, warahmah. Silih hampura, silih ngartos, sareng silih ngadukung dina susah sareng bungah.

Hatur nuhun ka sadaya tamu anu parantos sumping sareng masihan doa. Mugia doa sadaya janten berkah kanggo panganten.

Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'seminar',title:'Sambutan Pembukaan Seminar Nasional',language:'Indonesia',event:'Perusahaan',builtin:true,text:`Selamat pagi dan salam sejahtera untuk kita semua. Yang terhormat para narasumber, peserta seminar, dan seluruh hadirin yang saya banggakan.

Atas nama panitia, saya mengucapkan selamat datang di Seminar Nasional dengan tema "Inovasi dan Adaptasi di Era Digital". Kita hidup di zaman yang berubah begitu cepat. Teknologi yang kemarin terasa canggih, hari ini sudah tertinggal. Jika kita tidak beradaptasi, kita akan tertinggal. Itulah mengapa seminar hari ini sangat penting.

Hari ini kita akan belajar bersama, berdiskusi, dan bertukar pengalaman tentang bagaimana kita bisa tetap relevan, inovatif, dan berdampak. Saya berharap seminar ini bukan hanya menjadi tempat mendengarkan, tetapi juga tempat membangun jejaring dan melahirkan ide-ide baru.

Terima kasih kepada semua pihak yang telah mendukung acara ini. Mari kita manfaatkan waktu ini sebaik-baiknya. Dengan mengucapkan Bismillahirrahmanirrahim, seminar ini saya nyatakan resmi dibuka. Selamat berseminar, selamat belajar, dan selamat berkolaborasi.`},
{id:'perpisahan',title:'Pidato Perpisahan: Terima Kasih dan Sampai Jumpa',language:'Indonesia',event:'Perpisahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, selamat pagi semuanya.

Rasanya baru kemarin kita pertama kali bertemu, saling berkenalan dengan canggung. Dan sekarang, tanpa terasa, kita sudah harus berpisah.

Perpisahan memang selalu menyedihkan. Tapi perpisahan juga adalah tanda bahwa kita telah bertumbuh. Kita datang sebagai orang asing, dan kita pergi sebagai keluarga.

Saya ingin mengucapkan terima kasih. Terima kasih untuk tawa, untuk pelajaran, untuk kebersamaan, dan bahkan untuk air mata yang pernah kita bagi. Setiap kenangan bersama kalian akan selalu saya simpan.

Kepada Bapak/Ibu guru dan semua yang telah membimbing kami, terima kasih atas kesabaran dan ilmu yang telah diberikan. Jasa kalian tidak akan pernah kami lupakan.

Teman-teman, jangan jadikan perpisahan ini sebagai akhir. Jadikan ini sebagai awal untuk mimpi-mimpi baru kita. Kejarlah cita-cita kalian setinggi langit. Dan jika suatu hari kita bertemu lagi, semoga kita bertemu dalam versi terbaik dari diri kita masing-masing. Sampai jumpa, dan sukses selalu untuk kita semua.`},
{id:'perpisahan-en',title:'Farewell Speech: Thank You and Goodbye',language:'English',event:'Perpisahan',builtin:true,text:`Good morning, everyone.

It feels like only yesterday we first met, greeting each other awkwardly. And now, before we realise it, we already have to part.

Farewell is always sad. But farewell is also a sign that we have grown. We came as strangers, and we leave as family.

I want to say thank you. Thank you for the laughter, for the lessons, for the togetherness, and even for the tears we once shared. Every memory with you will always stay with me.

To our teachers and everyone who has guided us, thank you for your patience and the knowledge you have given. Your service will never be forgotten.

Friends, do not make this farewell the end. Make it the beginning of our new dreams. Chase your dreams as high as the sky. And if one day we meet again, may we meet as the best versions of ourselves. Goodbye, and good luck to all of us.`},
{id:'conference',title:'Opening Speech: Welcome to Our Annual Conference',language:'English',event:'Perusahaan',builtin:true,text:`Good morning, everyone, and welcome to our Annual Conference 2026!

It is wonderful to see so many familiar faces, and so many new ones, all in one room. This year, our theme is "Grow Together, Lead Together". Because we believe that true success is never built alone. It is built by teams that trust each other, by leaders who listen, and by people who dare to try new things.

Over the next two days, we will share ideas, learn from experts, and celebrate our achievements. I encourage you to ask questions, meet new people, and take every opportunity to grow.

Thank you to our amazing team who worked so hard to make this event happen. And thank you to all of you for being here. Let us make this conference unforgettable. Welcome, and enjoy!`},
{id:'ultah',title:'Pidato Ulang Tahun Sekolah / Perusahaan',language:'Indonesia',event:'Ulang Tahun',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, selamat pagi dan salam sejahtera.

Hari ini adalah hari yang istimewa. Hari ini kita merayakan ulang tahun yang ke-20 lembaga kita tercinta. Dua puluh tahun bukan waktu yang singkat. Di dalamnya ada perjuangan, ada jatuh bangun, ada tawa, dan ada air mata. Tapi kita masih berdiri di sini, lebih kuat dari sebelumnya.

Semua ini bisa terjadi karena satu hal: kebersamaan. Terima kasih kepada para pendiri yang telah memulai mimpi ini, kepada para guru dan karyawan yang setia mengabdi, dan kepada semua siswa dan alumni yang telah membawa nama baik lembaga ini.

Ulang tahun ini bukan hanya tentang merayakan masa lalu, tapi juga tentang menatap masa depan. Mari kita jadikan momentum ini untuk terus berinovasi, meningkatkan kualitas, dan memberikan yang terbaik.

Selamat ulang tahun! Semoga semakin jaya, semakin bermanfaat, dan semakin dicintai. Terima kasih.`},
{id:'ultah-en',title:'Anniversary Speech: School / Company Anniversary',language:'English',event:'Ulang Tahun',builtin:true,text:`Good morning and greetings to us all.

Today is a special day. Today we celebrate the 20th anniversary of our beloved institution. Twenty years is not a short time. In it there were struggles, ups and downs, laughter, and tears. But we are still standing here, stronger than before.

All of this could happen because of one thing: togetherness. Thank you to the founders who started this dream, to the teachers and staff who have faithfully served, and to all the students and alumni who have carried the good name of this institution.

This anniversary is not only about celebrating the past, but also about looking to the future. Let us use this moment to keep innovating, improving quality, and giving our best.

Happy anniversary! May we grow more glorious, more useful, and more loved. Thank you.`},
{id:'ultah-zh',title:'周年演讲：学校 / 公司周年',subtitle:'Pidato Ulang Tahun Sekolah / Perusahaan',language:'Mandarin / 中文',event:'Ulang Tahun',builtin:true,text:`大家早上好。今天是一个特别的日子。今天我们庆祝我们亲爱的机构成立二十周年。二十年不是一段短暂的时间。在这段时间里，有奋斗，有起起落落，有笑声，也有眼泪。但我们依然站在这里，比以前更强大。这一切能够实现，是因为一件事：团结。感谢开始这个梦想的创始人，感谢忠诚奉献的老师和员工，感谢所有为机构带来好名声的学生和校友。这次周年不仅是庆祝过去，更是展望未来。让我们借此机会不断创新，提高质量，奉献出最好的自己。周年快乐！愿我们越来越辉煌，越来越有价值，越来越受喜爱。谢谢大家！`},
{id:'motivasi',title:'Pidato Motivasi: Jangan Takut Gagal',language:'Indonesia',event:'Motivasi',builtin:true,text:`Selamat pagi, teman-teman semua.

Hari ini saya tidak akan berbicara tentang kesuksesan. Saya akan berbicara tentang kegagalan. Karena jujur saja, siapa di sini yang tidak pernah gagal? Saya pernah gagal. Saya pernah ditolak, diremehkan, dan hampir menyerah. Tapi justru dari kegagalan itulah saya belajar paling banyak.

Gagal itu bukan akhir. Gagal itu adalah guru terbaik. Setiap orang sukses yang kalian kagumi hari ini, mereka pernah gagal berkali-kali. Bedanya, mereka tidak berhenti. Mereka bangkit lagi, belajar lagi, dan mencoba lagi dengan cara yang lebih baik.

Jadi, jika hari ini kalian sedang gagal, jangan malu. Jangan menyerah. Anggap itu sebagai tanda bahwa kalian sedang berjuang untuk sesuatu yang besar.

Ingat, tidak ada mimpi yang terlalu besar, dan tidak ada usaha yang sia-sia. Mulailah dari sekarang, dari hal kecil, dari langkah pertama. Karena seribu kilometer pun dimulai dari satu langkah.

Terima kasih, dan tetap semangat!`},
{id:'motivasi-en',title:"Motivational Speech: Don't Be Afraid to Fail",language:'English',event:'Motivasi',builtin:true,text:`Good morning, friends.

Today I will not talk about success. I will talk about failure. Because honestly, who here has never failed? I have failed. I have been rejected, underestimated, and almost gave up. But it was from failure that I learned the most.

Failure is not the end. Failure is the best teacher. Every successful person you admire today has failed many times. The difference is, they did not stop. They got up again, learned again, and tried again in a better way.

So, if today you are failing, do not be ashamed. Do not give up. Take it as a sign that you are fighting for something big.

Remember, no dream is too big, and no effort is wasted. Start now, from something small, from the first step. Because a journey of a thousand kilometres also begins with one step.

Thank you, and keep your spirits up!`},
{id:'mandarin-wisuda',title:'毕业典礼演讲：未来属于我们',subtitle:'Pidato Wisuda - Masa Depan Milik Kita',language:'Mandarin / 中文',event:'Wisuda',builtin:true,text:`尊敬的老师们，亲爱的家长们，亲爱的同学们，大家早上好。今天不仅是一个章节的结束，更是一个全新故事的开始。四年前，我们怀着紧张和好奇走进这里，彼此还是陌生人。今天，我们带着友谊、勇气和梦想离开，成为了家人。在这里，我们一起笑过，一起哭过，一起为考试熬夜，也一起庆祝每一个小小的胜利。我们学到的不只是书本上的知识，更学会了坚持、合作和相信自己。感谢老师们，你们不只是教我们知识，更教会我们如何思考、如何梦想、如何永不放弃。感谢父母们，感谢你们无尽的付出、祈祷和爱。现在，未来正在等着我们。有人会继续深造，有人会去工作，有人会去创业。无论选择哪条路，请记住：成功不是比谁跑得最快，而是比谁从不停止。祝贺大家，2026届毕业生！未来属于我们，让我们一起让它变得美好。谢谢大家！`},
{id:'mandarin-nikah',title:'婚礼致辞：一生的爱',subtitle:'Pidato Pernikahan - Cinta Seumur Hidup',language:'Mandarin / 中文',event:'Pernikahan',builtin:true,text:`各位来宾，大家晚上好，感谢大家今天来到这里，共同见证爱情。第一次见到这对新人，我就知道他们很特别。从他们看彼此的眼神中，你能看到那不只是爱情，更是归属感。婚姻不是找到一个完美的人，而是用完美的爱去爱一个不完美的人。是每一天都选择彼此，即使在困难的日子里，更要在困难的日子里。亲爱的新郎新娘：愿你们的爱一年比一年更深。愿你们在一起笑的时候比吵架的时候多。愿你们永远是彼此最好的朋友、最大的支持者和最安全的地方。愿你们的家永远充满温暖、笑声和无尽的爱。请大家举起酒杯。为了爱，为了笑声，为了幸福的未来。干杯！`},
{id:'mandarin-perusahaan',title:'开幕致辞：欢迎参加年度大会',subtitle:'Sambutan Pembukaan - Konferensi Tahunan',language:'Mandarin / 中文',event:'Perusahaan',builtin:true,text:`大家早上好，欢迎参加我们的2026年度大会！很高兴看到这么多熟悉的面孔，还有这么多新朋友，大家聚在一起。今年我们的主题是‘一起成长，一起引领’。因为我们相信，真正的成功从来不是一个人创造的。它来自互相信任的团队，来自愿意倾听的领导者，来自敢于尝试新事物的人。在接下来的两天里，我们将分享想法，向专家学习，并庆祝我们的成就。我鼓励大家多提问，多认识新朋友，抓住每一个成长的机会。感谢我们出色的团队，是他们辛勤工作才让这次活动成为可能。也感谢你们每一位的到来。让我们一起让这次大会变得难忘。欢迎大家，祝大家玩得开心！`},
{id:'mandarin-motivasi',title:'励志演讲：不要害怕失败',subtitle:'Pidato Motivasi - Jangan Takut Gagal',language:'Mandarin / 中文',event:'Motivasi',builtin:true,text:`大家早上好，朋友们。今天我不谈成功，我想谈谈失败。说实话，谁没有失败过呢？我曾经失败过。我曾经被拒绝过，被看不起过，也差点放弃过。但正是从失败中，我学到了最多。失败不是终点，失败是最好的老师。你们崇拜的每一个成功的人，他们都失败过很多次。不同的是，他们没有停下来。他们站起来，再学习，再用更好的方式尝试一次。所以，如果你今天正在失败，不要害羞，不要放弃。把失败看作是你正在为一件大事而奋斗的证明。记住，没有梦想太大，没有努力会白费。从现在开始，从小事开始，从第一步开始。因为千里之行，始于足下。谢谢大家，继续加油！`},
{id:'mandarin-perpisahan',title:'告别演讲：谢谢，再见',subtitle:'Pidato Perpisahan - Terima Kasih dan Sampai Jumpa',language:'Mandarin / 中文',event:'Perpisahan',builtin:true,text:`大家好，早上好。感觉我们昨天才刚刚相遇，还带着一点害羞地互相介绍。而现在，不知不觉，我们已经要说再见了。告别总是让人难过，但告别也证明我们已经成长了。我们来的时候是陌生人，离开的时候已经是一家人。我想说一声谢谢。谢谢你们的笑声，谢谢你们的教导，谢谢你们的陪伴，甚至谢谢我们一起流过的眼泪。和你们在一起的每一段回忆，我都会好好珍藏。感谢老师们和所有帮助过我们的人，感谢你们的耐心和教导。你们的恩情我们永远不会忘记。朋友们，不要把告别当作结束。把它当作新梦想的开始。去追逐你们的梦想吧，越高越好。希望有一天我们再相遇时，我们都已经成为了更好的自己。再见了，祝大家一切顺利，前程似锦！`},
{id:'minang-nikah',title:'Pidato Pernikahan Basa Minang',language:'🇮🇩 Minangkabau - Basa Minang (Sumatera Barat)',event:'Pernikahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Sanak sadonyo nan ambo hormati, tamu undangan, jo kaduo mempelai nan babahagia. Puji syukur ka Allah SWT, ateh rahmat-Nyo kito dapek bakumpua di acara nan bahagia ko, manyaksikan basatunyo duo insan dalam ikatan suci pernikahan. Pernikahan ko bukan hanyo manyatukan duo urang, tapi manyatukan duo keluarga gadang manjadi satu keluarga nan rukun. Ka kaduo mempelai, semoga manjadi keluarga nan sakinah, mawaddah, warahmah. Saling mangarati, saling maampuni, jo saling mandukung dalam susah jo sanang. Tarimo kasih ka sadonyo tamu nan alah datang jo mambari doa. Semoga doa kito manjadi berkah untuak kaduo mempelai. Wassalamu'alaikum warahmatullahi wabarakatuh.`},
{id:'bali-pembukaan',title:'Sambutan Pembukaan Basa Bali',language:'🇮🇩 Bali - Basa Bali',event:'Perusahaan',builtin:true,text:`Om Swastiastu, Para tamu sane wangiang titiang, pinisepuh, miwah semeton sami sane tresna sihin titiang. Ngiring titiang ngaturang puji syukur majeng ring Ida Sang Hyang Widhi Wasa, duaning sangkaning asung kerta wara nugraha Ida, ring rahinane mangkin titiang sareng sami prasida mapupul ring acara sane becik puniki. Acara puniki wantah pinaka genah iraga sareng sami melajah, matukar pikayun, miwah nincapang kaweruhan. Dumogi acara puniki prasida mamargi antar, labda karya, miwah ngamolihang pikolih sane becik majeng ring iraga sami. Titiang ngaturang suksma majeng ring semeton sami sane sampun rauh miwah nyarengin acara puniki. Om Shanti Shanti Shanti Om.`},
{id:'bugis-nikah',title:'Pidato Pernikahan Basa Bugis',language:'🇮🇩 Bugis - Basa Bugis (Sulawesi Selatan)',event:'Pernikahan',builtin:true,text:`Assalamu'alaikum warahmatullahi wabarakatuh, Iya maneng tamu ripakalebbi, tomatowa, sibawa silellung keluarga maloppo. Puji syukur lao ri Puang Allah SWT, nasaba' barakka'na, ri esso iya makessinge, kitta' pada siakkumpuleng ri acara iya mapaccingnge, manyaksikan assiweddingengngi dua tau ri laleng ikatan suci pernikahan. Pernikahan iyae tenniya banna massiweddingengngi dua tau, tapi massiweddingengngi dua keluarga maloppo mancaji sewwa keluarga iya marukun. Lao ri iya dua mempelai, semoga mancaji keluarga iya sakinah, mawaddah, warahmah. Sipada sipakalebbi, sipada sipakatau, sibawa sipada siamasei ri laleng susa sibawa rennu. Terima kasih lao ri sininna tamu iya pura' polo sibawa mabbere doa. Semoga doata manjadi berkah lao ri iya dua mempelai. Wassalamu'alaikum warahmatullahi wabarakatuh.`},
];

function words(t:string){const s=t.trim();if(!s) return 0;if(isCjk(s)) return s.replace(/[\s\p{P}]/gu,'').length;return s.split(/\s+/).length}
function minutes(t:string){if(isCjk(t)) return Math.max(1,Math.round(words(t)/200));return Math.max(1,Math.round(words(t)/130))}
function formatTime(s:number){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${m}:${String(sec).padStart(2,'0')}`}
async function api(action:string,args:any){
  if(typeof window!=='undefined' && window.location.protocol==='file:'){
    const key='pidatopro-records';
    let store:Record<string,{id:string;value:any;created_at:string}[]>={}
    try{
      const parsed=JSON.parse(localStorage.getItem(key)||'{}');
      if(parsed && typeof parsed==='object'&&!Array.isArray(parsed)) store=parsed;
    }catch{}
    const collection=String(args?.collection||'');
    try{
      if(action==='records.list'){
        return {records:Array.isArray(store[collection])?store[collection]:[]};
      }
      if(action==='records.create'){
        const id=`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const record={id,value:args.value,created_at:new Date().toISOString()};
        store[collection]=[...(Array.isArray(store[collection])?store[collection]:[]),record];
        localStorage.setItem(key,JSON.stringify(store));
        return {id};
      }
      if(action==='records.replace'){
        store[collection]=(Array.isArray(store[collection])?store[collection]:[]).map(record=>record.id===args.id?{...record,value:args.value}:record);
        localStorage.setItem(key,JSON.stringify(store));
        return {id:args.id};
      }
      if(action==='records.delete'){
        store[collection]=(Array.isArray(store[collection])?store[collection]:[]).filter(record=>record.id!==args.id);
        localStorage.setItem(key,JSON.stringify(store));
        return {id:args.id};
      }
    }catch{
      throw new Error('Browser storage tidak tersedia. Aktifkan penyimpanan situs lalu coba lagi.');
    }
  }
  const r=await fetch("actions",{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,args})});
  const j=await r.json();
  if(!r.ok||j.error) throw new Error(j.error||'Gagal menghubungi layanan penyimpanan');
  return j.data;
}
function metaLine(s:Speech){return `${effectiveLanguage(s)} • ${s.event} • ±${minutes(s.text)} mnt`}

export default function App(){
  const [custom,setCustom]=useState<Speech[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState('');
  const [query,setQuery]=useState('');
  const [event,setEvent]=useState('Semua');
  const [selected,setSelected]=useState<Speech|null>(null);
  const [prompter,setPrompter]=useState<Speech|null>(null);
  const [editorOpen,setEditorOpen]=useState(false);
  // Tambah Pidato kini halaman penuh, bukan modal: hanya scroll halaman utama.
  // Saat dibuka, kembali ke atas agar Judul terlihat pertama.
  useEffect(()=>{
    if(!editorOpen) return;
    window.scrollTo({top:0,behavior:'auto'});
  },[editorOpen]);
  const [editing,setEditing]=useState<Speech|null>(null);
  const [draft,setDraft]=useState<Draft>({title:'',event:'',text:''});
  const [eventOpen,setEventOpen]=useState(false);
  const [templateOpen,setTemplateOpen]=useState(false);
  const eventRef=useRef<HTMLDivElement>(null);
  const templateRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!eventOpen && !templateOpen) return;
    const onDown=(e:MouseEvent)=>{
      const t=e.target as Node;
      if(eventRef.current?.contains(t)||templateRef.current?.contains(t)) return;
      setEventOpen(false); setTemplateOpen(false);
    };
    const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape'){ setEventOpen(false); setTemplateOpen(false); } };
    document.addEventListener('mousedown',onDown);
    document.addEventListener('keydown',onKey);
    return ()=>{ document.removeEventListener('mousedown',onDown); document.removeEventListener('keydown',onKey); };
  },[eventOpen,templateOpen]);
  function toggleEventSug(){ setEventOpen(v=>!v); }
  function toggleTemplate(){ setTemplateOpen(v=>!v); }
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [deleteTarget,setDeleteTarget]=useState<Speech|null>(null);
  const [explanationOpen,setExplanationOpen]=useState(true);
  const [groupExpanded,setGroupExpanded]=useState<Record<string,boolean>>({});
  const [myOpen,setMyOpen]=useState(true);
  const [showBackToTop,setShowBackToTop]=useState(false);
  useEffect(()=>{
    const onScroll=()=>{ setShowBackToTop(window.scrollY>400); };
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>{ window.removeEventListener('scroll',onScroll); };
  },[]);
  const [themeId,setThemeId]=useState('ungu');
  const [themeRecordId,setThemeRecordId]=useState<string|null>(null);
  const activeTheme=THEMES.find(t=>t.id===themeId)||THEMES[0];
  const isDarkTheme=themeId==='hitam';
  const darkBtnStyle: React.CSSProperties | undefined = isDarkTheme ? {background:'linear-gradient(180deg,#2b2b2b,#000000)',border:'1px solid rgba(255,255,255,0.35)',color:'#ffffff',boxShadow:'0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)'} : undefined;
  const darkCardStyle: React.CSSProperties | undefined = isDarkTheme ? {background:'#1e1e1e',borderColor:'#333333'} : undefined;
  const darkInputStyle: React.CSSProperties | undefined = isDarkTheme ? {background:'#222222',color:'#ffffff',borderColor:'#333333'} : undefined;
  const darkTitleStyle: React.CSSProperties | undefined = isDarkTheme ? {color:'#ffffff'} : undefined;
  const darkMutedStyle: React.CSSProperties | undefined = isDarkTheme ? {color:'#d1d5db'} : undefined;

  const reloadRecords=async():Promise<Speech[]>=>{
    try{
      const data=await api("records.list",{collection:'custom_speeches'});
      // Pidato Saya: hanya teks user yang tersimpan. Tidak pernah dicampur ke Template.
      // Entri lama berjudul "Doa Doa" yang sudah dihapus di database tidak ditampilkan lagi;
      // sebagai pengaman, saring juga di sisi tampilan bila masih ada sisa record lama.
      const rows=(data?.records||[])
        .filter((r:any)=>String(r.value?.title||'').trim().toLowerCase()!=='doa doa')
        .map((r:any)=>({id:`custom-${r.id}`,recordId:r.id,title:r.value.title||'Tanpa judul',language:r.value.language||'',event:r.value.event||'Motivasi',text:r.value.text||'',builtin:false,created_at:r.created_at}));
      setCustom(rows); setLoadError('');
      return rows;
    }catch(e){ setLoadError('Pidato pribadi belum bisa dimuat.'); return []; }
    finally{setLoading(false)}
  };
  useEffect(()=>{reloadRecords()},[]);
  useEffect(()=>{ (async()=>{ try{ const data=await api("records.list",{collection:'app_settings'}); const row=(data?.records||[]).find((r:any)=>r.value?.key==='theme'); if(row&&THEMES.some(t=>t.id===row.value.theme)){ setThemeId(row.value.theme); setThemeRecordId(row.id); } }catch{} })(); },[]);
  async function chooseTheme(id:string){
    setThemeId(id);
    try{
      const value={key:'theme',theme:id};
      if(themeRecordId){ await api("records.replace",{collection:'app_settings',id:themeRecordId,value}); }
      else { const created=await api("records.create",{collection:'app_settings',value,idempotency_key:'app-theme-setting'}); if(created?.id) setThemeRecordId(created.id); }
    }catch{
      try{
        const data=await api("records.list",{collection:'app_settings'});
        const row=(data?.records||[]).find((r:any)=>r.value?.key==='theme');
        if(row){ setThemeRecordId(row.id); await api("records.replace",{collection:'app_settings',id:row.id,value:{key:'theme',theme:id}}); }
      }catch{}
    }
  }

  // TEMPLATE = hanya pidato bawaan (BUILTIN). Ketikan user TIDAK PERNAH masuk ke sini.
  const templates = BUILTIN;
  const templateOptions=useMemo(()=>{const present=Array.from(new Set(templates.map(s=>groupKeyFor(s))));return present.sort((a,b)=>groupOrderIndex(a)-groupOrderIndex(b))},[templates]);
  const filtered=useMemo(()=>templates.filter(s=>{ if(event==='Bahasa Daerah') return isRegionalSpeech(s); if(event!=='Semua'&&(s.event!==event||isRegionalSpeech(s))) return false; return query===''||(s.title+' '+(s.subtitle||'')+' '+s.event+' '+s.text).toLowerCase().includes(query.toLowerCase()); }),[templates,event,query]);

  // PIDATO SAYA = hanya teks user. Disaring oleh pencarian saja, bukan filter Template.
  const myFiltered=useMemo(()=>custom.filter(s=> query===''||(s.title+' '+s.event+' '+s.text).toLowerCase().includes(query.toLowerCase())),[custom,query]);

  const grouped=useMemo(()=>{
    const byEvent=new Map<string, Speech[]>();
    filtered.forEach(s=>{ const ev=groupKeyFor(s); if(!byEvent.has(ev)) byEvent.set(ev,[]); byEvent.get(ev)!.push(s); });
    const base=Array.from(byEvent.entries()).sort((a,b)=>groupOrderIndex(a[0])-groupOrderIndex(b[0])).map(([eventName,speeches])=>{
      const sorted=[...speeches].sort((a,b)=>{
        if(eventName==='Bahasa Daerah'){
          const ra=regionalSubgroup(a)==='Pernikahan'?0:1;
          const rb=regionalSubgroup(b)==='Pernikahan'?0:1;
          if(ra!==rb) return ra-rb;
          return a.title.localeCompare(b.title);
        }
        const la=languageRank(a);
        const lb=languageRank(b);
        if(la!==lb) return la-lb;
        return a.title.localeCompare(b.title);
      });
      return {event:eventName,total:speeches.length,speeches:sorted};
    });
    const savedSpeeches=[...myFiltered].sort((a,b)=>a.title.localeCompare(b.title));
    return [...base,{event:'Riwayat Tersimpan',total:savedSpeeches.length,speeches:savedSpeeches}];
  },[filtered,myFiltered]);

  const isGroupOpen=(k:string)=>groupExpanded[k]!==false;
  useEffect(()=>{
    const searching=query.trim()!==''||event!=='Semua';
    if(!searching) return;
    setGroupExpanded(prev=>{const next={...prev}; grouped.forEach(g=>{next[g.event]=true}); return next;});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[query,event,filtered]);
  function openAll(){ const next:Record<string,boolean>={}; grouped.forEach(g=>{next[g.event]=true}); setGroupExpanded(next); }
  function closeAll(){ const next:Record<string,boolean>={}; grouped.forEach(g=>{next[g.event]=false}); setGroupExpanded(next); }

  function openEditor(s?:Speech){
    setSaveError('');
    setEventOpen(false);
    if(s){ setEditing(s); setDraft({title:s.title,event:s.event,text:s.text}); }
    else { setEditing(null); setDraft({title:'',event:'',text:''}); }
    setEditorOpen(true);
  }
  async function saveDraft(){
    if(!draft.title.trim()||!draft.text.trim()||!draft.event.trim()){setSaveError('Judul, acara, dan teks wajib diisi.');return}
    setSaving(true);setSaveError('');
    try{
      const detected=detectLanguageLabel(draft.text.trim());
      const value={title:draft.title.trim(),language:detected==='Teks'?'':detected,event:draft.event.trim(),text:draft.text.trim()};
      if(editing && !editing.builtin && editing.recordId && !editing.once){
        await api("records.replace",{collection:'custom_speeches',id:editing.recordId,value});
      }else{
        await api("records.create",{collection:'custom_speeches',value,idempotency_key:`speech-${Date.now()}-${draft.title.trim().slice(0,20)}`});
      }
      const rows=await reloadRecords();
      setEditorOpen(false);
      const savedRow=rows.find(r=>r.title===value.title&&r.text===value.text);
      setSelected(savedRow||{id:editing&&!editing.builtin&&!editing.once?editing.id:`custom-${Date.now()}`,title:value.title,language:value.language,event:value.event,text:value.text,builtin:false});
    }catch(e){setSaveError(e instanceof Error?e.message:'Gagal menyimpan pidato.')}
    finally{setSaving(false)}
  }
  async function doDelete(){
    if(!deleteTarget?.recordId) return;
    setSaving(true);
    try{ await api("records.delete",{collection:'custom_speeches',id:deleteTarget.recordId}); await reloadRecords(); setDeleteTarget(null); if(selected?.id===deleteTarget.id) setSelected(null); }
    catch(e){ setSaveError('Gagal menghapus pidato.'); }
    finally{setSaving(false)}
  }

  function renderSpeechCard(s:Speech){
    return (
      <article key={s.id} style={darkCardStyle} className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <button onClick={()=>setSelected(s)} className="text-left">
          <span style={isDarkTheme?{color:'#ffffff',background:'#2a2a2e'}:undefined} className="mb-2 inline-flex max-w-full items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold [overflow-wrap:anywhere]">{effectiveLanguage(s)}</span>
          <h3 style={darkTitleStyle} className={`text-[19px] font-bold leading-snug [overflow-wrap:anywhere] ${isDarkTheme?'':'hover:text-[var(--primary)]'} ${speechIsMandarin(s)?'font-mandarin text-[21px]':'font-display'}`}>{s.title}</h3>
          <p style={darkMutedStyle} className="mt-2 text-xs font-medium text-[var(--muted)] [overflow-wrap:anywhere]">{metaLine(s)}{!s.builtin?' • Saya':''}</p>
        </button>
        <button onClick={()=>setPrompter(s)} style={darkBtnStyle} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--primary-2)]"><Play size={16} fill="currentColor"/> Teleprompter</button>
      </article>
    );
  }

  function renderMyCard(s:Speech){
    return (
      <article key={s.id} style={darkCardStyle} className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <button onClick={()=>setSelected(s)} className="text-left">
          <span style={isDarkTheme?{color:'#ffffff',background:'#2a2a2e'}:undefined} className="mb-2 inline-flex max-w-full items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold [overflow-wrap:anywhere]">{effectiveLanguage(s)}</span>
          <h3 style={darkTitleStyle} className={`text-[19px] font-bold leading-snug [overflow-wrap:anywhere] ${isDarkTheme?'':'hover:text-[var(--primary)]'} ${speechIsMandarin(s)?'font-mandarin text-[21px]':'font-display'}`}>{s.title}</h3>
          <p style={darkMutedStyle} className="mt-2 text-xs font-medium text-[var(--muted)] [overflow-wrap:anywhere]">{metaLine(s)} • Saya</p>
        </button>
        <button onClick={()=>setPrompter(s)} style={darkBtnStyle} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--primary-2)]"><Play size={16} fill="currentColor"/> Teleprompter</button>
        <div className="mt-2 flex gap-2">
          <button onClick={()=>openEditor(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2.5 text-xs font-bold"><Pencil size={14}/> Edit</button>
          <button onClick={()=>setDeleteTarget(s)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600"><Trash2 size={14}/> Hapus</button>
        </div>
      </article>
    );
  }

  return (
  <div data-safe-area-inset-root style={{boxSizing:'border-box',paddingTop:'var(--safe-area-inset-top)',minHeight:'100dvh',background:'var(--paper)',color:'var(--ink)',...themeVars(activeTheme)}} className="overflow-x-clip">
    <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)',zIndex:1000,background:isDarkTheme?'#111111':'var(--surface)',borderBottom:isDarkTheme?'1px solid #333333':'1px solid #e5e7eb',boxShadow:'0 4px 20px rgba(0,0,0,0.12)'}} className="fixed left-0 right-0 w-full">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2.5 px-3.5 py-3 sm:flex-nowrap sm:gap-3 sm:px-6 sm:py-0 sm:h-[72px]" style={{boxSizing:'border-box'}}>
        <button onClick={()=>{setSelected(null);setEditorOpen(false);setQuery('');setEvent('Semua')}} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" style={{flexShrink:1}}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={isDarkTheme?{background:'linear-gradient(180deg,#2b2b2b,#000000)',border:'1px solid rgba(255,255,255,0.35)',color:'#ffffff'}:{background:'var(--primary)'}}><Mic size={18}/></span>
          <span className="font-display font-black leading-none" style={{fontSize:'clamp(18px,5.5vw,24px)',whiteSpace:'nowrap',color:isDarkTheme?'#ffffff':undefined}}>Pidato<span style={{color:isDarkTheme?'#d1d5db':undefined}} className={isDarkTheme?'':'text-[var(--primary)]'}>Pro</span></span>
        </button>
        {editorOpen ? (
          <button onClick={()=>setEditorOpen(false)} style={darkBtnStyle} className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--primary)] px-3.5 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--primary-2)] sm:text-sm sm:px-4"><X size={17}/> Kembali ke Daftar</button>
        ) : (
          <button onClick={()=>openEditor()} style={darkBtnStyle} className="flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--primary)] px-3.5 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--primary-2)] sm:text-sm sm:px-4 [@media(max-width:359px)]:w-full [@media(max-width:359px)]:max-w-none [@media(max-width:359px)]:flex-none [@media(max-width:359px)]:basis-full"><Plus size={17}/> Tambah Pidato</button>
        )}
      </div>
    </header>

    {!editorOpen && (<main className="mx-auto box-border w-full max-w-5xl px-3 pb-16 pt-[84px] sm:px-6 sm:pt-[88px] [@media(max-width:359px)]:pt-[124px]">
      {explanationOpen ? (
        <section style={{width:'100%',maxWidth:'100%',boxSizing:'border-box',display:'block',background:isDarkTheme?'#1e1e1e':undefined,borderColor:isDarkTheme?'#333333':undefined,color:isDarkTheme?'#ffffff':undefined}} className="relative z-[1] rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6">
          <div className="block w-full" style={{width:'100%',boxSizing:'border-box'}}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{width:'100%',whiteSpace:'normal',wordWrap:'break-word',overflowWrap:'break-word',textAlign:'left'}} className="min-w-0 flex-1 basis-[220px] font-display text-[clamp(22px,4vw,28px)] font-black leading-tight [overflow-wrap:anywhere]">Apa itu PidatoPro?</h2>
              <button onClick={()=>setExplanationOpen(false)} className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold">Sembunyikan penjelasan <ChevronDown size={14} className="rotate-180"/></button>
            </div>
            <p style={{width:'100%',boxSizing:'border-box',whiteSpace:'normal',wordWrap:'break-word',overflowWrap:'break-word',textAlign:'left',lineHeight:1.6}} className="mt-2 block text-[14px] text-[var(--muted)] sm:text-[15px]">Baca pidato tanpa menghafal. Teks berjalan sendiri dari bawah ke atas, seperti di TV.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-2)] p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-sm font-black text-white">1</span><BookOpen size={18} className="text-[var(--primary)]"/></div><p className="mt-3 font-bold">1. Pilih Pidato</p><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Pilih dari daftar, atau buat sendiri.</p></div>
            <div className="rounded-2xl bg-[var(--surface-2)] p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-sm font-black text-white">2</span><MousePointerClick size={18} className="text-[var(--primary)]"/></div><p className="mt-3 font-bold">2. Tekan Teleprompter</p><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Tekan tombol Teleprompter.</p></div>
            <div className="rounded-2xl bg-[var(--surface-2)] p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--primary)] text-sm font-black text-white">3</span><Eye size={18} className="text-[var(--primary)]"/></div><p className="mt-3 font-bold">3. Baca Saja</p><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">Teks jalan sendiri. Kecepatan bisa diatur.</p></div>
          </div>
        </section>
      ) : (
        <div style={isDarkTheme?{background:'#1e1e1e',borderColor:'#333333',color:'#ffffff'}:undefined} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <p className="text-sm font-bold">Apa itu PidatoPro? <span className="font-medium text-[var(--muted)]">Cara pakainya gampang, hanya 3 langkah.</span></p>
          <button onClick={()=>setExplanationOpen(true)} style={darkBtnStyle} className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white">Tampilkan lagi</button>
        </div>
      )}

      <section aria-label="Warna tampilan" style={isDarkTheme?{background:'#1e1e1e',borderColor:'#333333',color:'#ffffff'}:undefined} className="mt-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold"><Palette size={17} className="text-[var(--primary)]"/> Warna Tampilan:</p>
          <p className="text-sm">Warna aktif: <b style={isDarkTheme?{color:'#d1d5db'}:undefined} className="text-[var(--primary)]">{activeTheme.name}</b></p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {THEMES.map(t=>{
            const active=t.id===themeId;
            return <button key={t.id} onClick={()=>chooseTheme(t.id)} aria-label={`Pilih warna ${t.name}`} aria-pressed={active} title={t.name} className={`grid h-11 w-11 place-items-center rounded-full border-2 transition ${active?'border-[var(--ink)] scale-110 shadow-md':'border-transparent'}`} style={{background:t.id==='hitam'?'#111111':t.primary, color:'#fff'}}>{active&&<Check size={20} strokeWidth={3}/>}</button>
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">Ketuk bulatan warna untuk mengubah tombol dan aksen di seluruh aplikasi. Pilihanmu tersimpan otomatis.</p>
      </section>

      <div className="mt-4 flex flex-col gap-2.5">
        <label className="relative block w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari pidato…" style={darkInputStyle} className={`w-full rounded-full border border-[var(--line)] bg-[var(--surface)] py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)] ${isDarkTheme?'placeholder:text-[#9ca3af]':''}`}/></label>
        <div className="flex flex-wrap items-center gap-2.5">
          <div ref={templateRef} className="relative block min-w-0 flex-1 basis-[240px]"><LayoutTemplate className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--primary)]" size={19} style={isDarkTheme?{color:'#ffffff'}:undefined}/><button type="button" aria-label="Template Pidato" aria-haspopup="listbox" aria-expanded={templateOpen} onClick={toggleTemplate} style={isDarkTheme?{background:'#222222',color:'#ffffff',borderColor:'rgba(255,255,255,0.45)'}:darkInputStyle} className="relative w-full rounded-full border border-[var(--line)] bg-[var(--surface)] py-3.5 pl-11 pr-10 text-left text-sm font-bold shadow-sm outline-none backdrop-blur focus:border-[var(--primary)] [overflow-wrap:anywhere]"><span className="[overflow-wrap:anywhere]">{event==='Semua'?'Template Pidato — Semua Template':event}</span><ChevronDown size={18} className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${templateOpen?'rotate-180':'rotate-0'}`}/></button>{templateOpen && <div role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xl"><button type="button" onClick={()=>{setEvent('Semua');setTemplateOpen(false)}} className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-[var(--surface-2)] ${event==='Semua'?'bg-[var(--surface-2)] font-bold':'font-medium'}`}><span className="[overflow-wrap:anywhere]">Template Pidato — Semua Template</span>{event==='Semua' && <span aria-hidden="true">✓</span>}</button>{templateOptions.map(x=>(<button key={x} type="button" onClick={()=>{setEvent(x);setTemplateOpen(false)}} className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-[var(--surface-2)] ${event===x?'bg-[var(--surface-2)] font-bold':'font-medium'}`}><span className="[overflow-wrap:anywhere]">{x}</span>{event===x && <span aria-hidden="true">✓</span>}</button>))}</div>}</div>
          {event!=='Semua' && <span style={darkBtnStyle} className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--primary)] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm"><span className="[overflow-wrap:anywhere]">Template aktif: {event}</span><button type="button" onClick={()=>setEvent('Semua')} aria-label="Tampilkan semua template" className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"><X size={13}/></button></span>}
        </div>
        <p className="text-xs text-[var(--muted)]">Filter ini hanya untuk Template bawaan. Riwayat Tersimpan di paling bawah tidak ikut filter Template.</p>
      </div>
      {loadError && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{loadError}</p>}



      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--muted)]">{loading?'Memuat…':`${filtered.length} Template bawaan`}</p>
        <div className="flex gap-2">
          <button onClick={openAll} style={darkBtnStyle} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold">Buka Semua</button>
          <button onClick={closeAll} style={darkBtnStyle} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold">Tutup Semua</button>
        </div>
      </div>

      <h2 className="mt-3 text-sm font-black [overflow-wrap:anywhere]" style={darkTitleStyle}>Template Pidato <span className="font-medium text-[var(--muted)]" style={darkMutedStyle}>— hanya pidato bawaan, tidak bertambah karena ketikanmu</span></h2>
      <section className="mt-3 space-y-3">
        {grouped.map(g=>{
          const groupOpen=isGroupOpen(g.event);
          return (
          <div key={g.event} style={darkCardStyle} className={`overflow-hidden rounded-2xl border ${groupOpen?'border-[var(--primary)] bg-[var(--surface)]':'border-[var(--line)] bg-[var(--surface)]'}`}>
            <button onClick={()=>setGroupExpanded(p=>({...p,[g.event]:!groupOpen}))} aria-expanded={groupOpen} style={darkTitleStyle} className={`flex w-full items-center gap-2 px-4 py-3.5 text-left ${groupOpen?'bg-[var(--surface-2)]':''}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-white transition-transform ${groupOpen?'rotate-0':'-rotate-90'}`} style={isDarkTheme?{background:'linear-gradient(180deg,#2b2b2b,#000000)',border:'1px solid rgba(255,255,255,0.35)',color:'#ffffff'}:undefined}><ChevronDown size={16}/></span>
              <span className="min-w-0 flex-1 font-bold [overflow-wrap:anywhere]" style={darkTitleStyle}>{g.event} <span className="font-medium text-[var(--muted)]" style={darkMutedStyle}>({g.total} pidato)</span></span>
              <span className="shrink-0 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold" style={isDarkTheme?{color:'#ffffff',background:'#2a2a2e'}:undefined}>{groupOpen?'Tutup':'Buka'}</span>
            </button>
            {groupOpen && (g.event==='Riwayat Tersimpan' ? (
              <div className="p-3">
                <p className="px-1 pb-2 text-xs leading-relaxed text-[var(--muted)]">Teks yang kamu simpan dari Riwayat. Template bawaan tetap di atas.</p>
                {g.speeches.length===0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center">
                    <p className="font-bold">Belum ada teks tersimpan</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Simpan teks dari form Tambah Pidato, maka teks itu muncul di sini.</p>
                    <button onClick={()=>openEditor()} style={darkBtnStyle} className="mt-3 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white">Tambah Teks</button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">{g.speeches.map(s=>renderMyCard(s))}</div>
                )}
              </div>
            ) : g.event==='Bahasa Daerah' ? (
              <div className="space-y-5 p-3">
                {[{label:'Pernikahan',items:g.speeches.filter(s=>regionalSubgroup(s)==='Pernikahan')},{label:'Adat',items:g.speeches.filter(s=>regionalSubgroup(s)==='Adat')}].filter(sub=>sub.items.length>0).map(sub=>(
                  <div key={sub.label}>
                    <p style={darkTitleStyle} className="px-1 text-sm font-black [overflow-wrap:anywhere]">{sub.label} <span className="font-medium text-[var(--muted)]" style={darkMutedStyle}>({sub.items.length} pidato)</span></p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">{sub.items.map(s=>renderSpeechCard(s))}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 p-3 sm:grid-cols-2">{g.speeches.map(s=>renderSpeechCard(s))}</div>
            ))}
          </div>
          );
        })}
      </section>
      {filtered.length===0 && myFiltered.length===0 && !loading && <div className="mt-6 rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center"><p className="font-bold">Tidak ada pidato yang cocok</p><p className="mt-1 text-sm text-[var(--muted)]">Coba ubah kata kunci atau filter.</p><button onClick={()=>openEditor()} style={darkBtnStyle} className="mt-4 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white">Buat Pidato Baru</button></div>}
    </main>)}

    {showBackToTop && !editorOpen && !prompter && !selected && (
      <button type="button" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Kembali ke atas" title="Kembali ke atas" className="back-to-top-in fixed z-[900] grid h-11 w-11 place-items-center transition active:scale-95" style={{bottom:'calc(24px + env(safe-area-inset-bottom, 0px))',right:'16px',background:'rgba(255,255,255,0.92)',border:'1px solid var(--primary)',borderRadius:'9999px',outline:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.08)',color:'var(--primary)'}}><ArrowUp size={22} strokeWidth={2.25} style={{color:'var(--primary)'}}/></button>
    )}

    {selected && (
      <div className="fixed inset-0 z-[1100] overflow-y-auto bg-black/50 p-3 pt-[max(1rem,var(--safe-area-inset-top))] sm:p-6">
        <div className="mx-auto min-h-full flex items-center justify-center"><div className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-[var(--surface)] shadow-2xl">
          <div className="p-5 sm:p-7">
            <h2 className={`text-[clamp(24px,4vw,32px)] font-black leading-tight [overflow-wrap:anywhere] ${speechIsMandarin(selected)?'font-mandarin':'font-display'}`}>{selected.title}</h2>
            {selected.subtitle && <p className="mt-1.5 text-sm font-semibold text-[var(--muted)] [overflow-wrap:anywhere]">{selected.subtitle}</p>}
            <p className="mt-2 text-xs font-medium text-[var(--muted)] [overflow-wrap:anywhere]">{metaLine(selected)}</p>
            {!selected.builtin && !selected.once && <div className="mt-3 flex gap-4 text-sm font-bold"><button onClick={()=>{const s=selected;setSelected(null);openEditor(s)}} className="text-[var(--primary)] underline underline-offset-4">Edit</button><button onClick={()=>setDeleteTarget(selected)} className="text-red-600 underline underline-offset-4">Hapus</button></div>}
            {selected.once && <p className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">Dipakai sekali saja — tidak disimpan</p>}
            {!selected.builtin && !selected.once && <p className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">Riwayat Tersimpan — Bukan Template</p>}
            <div className="mt-5 pr-1"><div className={`${speechIsMandarin(selected)?'font-mandarin':'font-speech'} space-y-4 text-[17px] [overflow-wrap:anywhere] ${speechIsMandarin(selected)?'leading-[2.1]':'leading-[1.85]'}`}>{selected.text.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</div></div>
          </div>
          <div className="flex gap-2 border-t border-[var(--line)] p-4">
            <button onClick={()=>setSelected(null)} className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold">Kembali</button>
            <button onClick={()=>{setPrompter(selected);setSelected(null)}} style={darkBtnStyle} className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white"><Play size={16} fill="currentColor"/> Mulai Teleprompter</button>
          </div>
        </div></div>
      </div>
    )}

    {editorOpen && (
      <main className="mx-auto box-border w-full max-w-[640px] px-3 pt-[84px] sm:px-6 sm:pt-[88px] [@media(max-width:359px)]:pt-[124px]" style={{paddingBottom:'calc(32px + env(safe-area-inset-bottom, 0px))'}}>
        <form onSubmit={e=>{e.preventDefault();saveDraft()}} className="flex w-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4 sm:px-6"><h2 className="font-display text-2xl font-black">{editing?'Edit Pidato':'Tambah Pidato'}</h2><button type="button" aria-label="Tutup" onClick={()=>setEditorOpen(false)} className="rounded-full bg-[var(--surface-2)] p-2"><X size={18}/></button></div>
          <div className="space-y-5 px-5 pb-4 pt-5 sm:px-6">
            <div className="w-full">
              <label htmlFor="speech-title" style={darkTitleStyle} className="block w-full text-[15px] font-bold leading-snug [overflow-wrap:anywhere]">Judul</label>
              <input id="speech-title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} className="mt-2 min-h-[52px] w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--primary)]" placeholder="Judul"/>
            </div>
            <div className="w-full">
              <label htmlFor="speech-event" style={darkTitleStyle} className="block w-full text-[15px] font-bold leading-snug [overflow-wrap:anywhere]">Acara</label>
              <input id="speech-event" value={draft.event} onChange={e=>setDraft({...draft,event:e.target.value})} autoComplete="off" className="mt-2 min-h-[52px] w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--primary)] [overflow-wrap:anywhere]" placeholder="Contoh: Wisuda (tulis bebas)"/>
            </div>
            <div className="w-full">
              <label htmlFor="speech-text" style={darkTitleStyle} className="block w-full text-[15px] font-bold leading-snug [overflow-wrap:anywhere]">Teks Pidato</label>
              <textarea id="speech-text" value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} rows={6} style={{height:'180px',minHeight:'180px',resize:'vertical'}} className="font-speech mt-2 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[16px] leading-relaxed outline-none focus:border-[var(--primary)]" placeholder="Tempel teks di sini"/>
            </div>
          <div className="mb-4 mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="font-bold">Riwayat</p>
            {loading ? <p className="mt-3 text-sm text-[var(--muted)]">Memuat riwayat…</p> : custom.length===0 ? (
              <p className="mt-3 rounded-xl bg-[var(--surface)] px-3 py-3 text-sm text-[var(--muted)]">Belum ada riwayat.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {custom.map(s=>(
                  <div key={s.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                    <p className="text-sm font-bold [overflow-wrap:anywhere]">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)] [overflow-wrap:anywhere]">{s.text.length>140 ? `${s.text.slice(0,140)}…` : s.text}</p>
                    <p className="mt-1 text-[11px] font-medium text-[var(--muted)] [overflow-wrap:anywhere]">{s.event}{s.created_at ? ` • ${new Date(s.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}` : ''}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={()=>{setDraft({title:s.title,event:s.event,text:s.text}); setEditing(s); setSaveError('');}} style={darkBtnStyle} className="flex-1 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white">Pakai Lagi</button>
                      <button type="button" onClick={()=>setDeleteTarget(s)} className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          <div className="border-t border-[var(--line)] bg-[var(--surface)] px-5 pt-4 sm:px-6">
          {saveError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
            <div className="flex gap-2"><button type="button" onClick={()=>setEditorOpen(false)} className="flex-1 rounded-xl border px-5 py-3 text-sm font-bold">Batal</button><button type="submit" disabled={saving} style={darkBtnStyle} className="flex-[2] rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white">{saving?'Menyimpan…':(editing?'Simpan ke Riwayat Tersimpan':'Simpan ke Riwayat Tersimpan')}</button></div>
          </div>
        </form>
      </main>
    )}

    {deleteTarget && (
      <div className="fixed inset-0 z-[1200] overflow-y-auto bg-black/60 p-4 pt-[max(1rem,var(--safe-area-inset-top))]"><div className="mx-auto min-h-full flex items-center justify-center"><div className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-6 text-center"><h3 className="text-lg font-black">Hapus pidato ini?</h3><p className="mt-1 text-sm text-[var(--muted)] [overflow-wrap:anywhere]">“{deleteTarget.title}” akan dihapus dari Riwayat Tersimpan.</p><div className="mt-5 flex gap-2"><button onClick={()=>setDeleteTarget(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold">Batal</button><button disabled={saving} onClick={doDelete} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white">Ya, Hapus</button></div></div></div></div>
    )}

    {prompter && <Teleprompter speech={prompter} onClose={()=>setPrompter(null)} isDarkTheme={isDarkTheme} />}
  </div>
  );
}

function Teleprompter({speech,onClose,isDarkTheme}:{speech:Speech;onClose:()=>void;isDarkTheme?:boolean}){
  const scrollRef=useRef<HTMLDivElement>(null);
  const contentRef=useRef<HTMLDivElement>(null);
  // SATU sumber kebenaran untuk status jalan/berhenti: isPlaying.
  // Ikon toggle SELALU dirender dari isPlaying — tidak ada isPaused / isCounting terpisah.
  // countdown & finished hanya penanda tampilan, bukan status jalan kedua.
  const [isPlaying,setIsPlaying]=useState(false);
  const playing=isPlaying;
  const [finished,setFinished]=useState(false);
  const [countdown,setCountdown]=useState<number|null>(null);
  const [goFlash,setGoFlash]=useState(false);
  const [speed,setSpeed]=useState(1);
  const speedRef=useRef(1);
  useEffect(()=>{ speedRef.current=speed; },[speed]);
  // Posisi disimpan sebagai FLOAT di posRef. translateY memakai nilai ini,
  // tanpa floor/round per frame, jadi kecepatan pelan (0.25–0.75) tetap jalan.
  const posRef=useRef(0);
  const [fontIdx,setFontIdx]=useState(()=>2);
  // Saat ukuran huruf berubah, jarak maksimum ikut berubah. Jepit posisi agar
  // teks tidak melompat / tertinggal di luar jangkauan.
  useEffect(()=>{
    const viewport=scrollRef.current; const content=contentRef.current;
    if(!viewport||!content) return;
    const max=Math.max(0,content.offsetHeight-viewport.clientHeight);
    if(posRef.current>max){ posRef.current=max; content.style.transform=`translate3d(0,${-posRef.current}px,0)`; setProgress(max>0?1:0); }
  },[fontIdx]);
  const [mirror,setMirror]=useState(false);
  const [progress,setProgress]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const isMandarin=speechIsMandarin(speech);
  const darkTeleBtnStyle: React.CSSProperties | undefined = isDarkTheme ? {background:'linear-gradient(180deg,#2b2b2b,#000000)',border:'1px solid rgba(255,255,255,0.35)',color:'#ffffff',boxShadow:'0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)'} : undefined;
  const fontSizesLatin=[22,30,40,54,72];
  const cjkHeavy=isCjkHeavy(speech.text);
  const effectiveFontSize=cjkHeavy?Math.max(16,Math.round(fontSizesLatin[fontIdx]*0.65)):fontSizesLatin[fontIdx];
  const totalSec=minutes(speech.text)*60;
  const remaining=Math.max(0,totalSec-elapsed);
  const spacing=cjkHeavy?1.8:1.7;
  const cjkWrapStyle:React.CSSProperties=cjkHeavy?{overflowWrap:'break-word',wordBreak:'keep-all',lineBreak:'strict'}:{overflowWrap:'break-word',wordBreak:'break-word',lineBreak:'normal'};

  function start(){ setFinished(false); setIsPlaying(false); setGoFlash(false); setCountdown(3); }
  function pause(){ setGoFlash(false); setCountdown(null); setIsPlaying(false); }
  function togglePlay(){
    if(finished){ restart(); return; }
    if(countdown!==null){ pause(); return; }
    if(isPlaying){ pause(); return; }
    start();
  }
  // Countdown berurutan 3 -> 2 -> 1, lalu SATU-SATUNYA transisi ke jalan:
  // isPlaying = true. Inilah yang membuat toggle otomatis berubah jadi Jeda.
  useEffect(()=>{ if(countdown===null) return; const t=setTimeout(()=>{ if(countdown>1){ setCountdown(countdown-1); } else { setCountdown(null); setGoFlash(true); setIsPlaying(true); } },850); return ()=>clearTimeout(t); },[countdown]);
  // Kilatan "MULAI" hanya penanda visual; scroll sudah berjalan karena isPlaying sudah true.
  useEffect(()=>{ if(!goFlash) return; const t=setTimeout(()=>setGoFlash(false),700); return ()=>clearTimeout(t); },[goFlash]);
  useEffect(()=>{ if(!isPlaying) return; const id=setInterval(()=>setElapsed(v=>v+1),1000); return ()=>clearInterval(id)},[isPlaying]);
  // Loop scroll hanya hidup saat isPlaying === true.
  // Gerak BERBASIS WAKTU: jarak = kecepatan * detik_yang_berlalu (deltaTime).
  // Kecepatan dibaca LIVE dari speedRef tiap frame, jadi geser slider saat jalan
  // langsung mengubah kecepatan tanpa stop/start ulang. Tidak ada threshold
  // minimum: 0.25 pun dihitung (36 px/detik * 0.25 = 9 px/detik).
  // posRef adalah satu-satunya sumber posisi dan TIDAK pernah di-reset saat
  // toggle Jeda/Play — hanya last yang di-reset di awal loop ini supaya tidak
  // ada lompatan besar setelah jeda. Jadi Play selalu melanjutkan dari pos terakhir.
  useEffect(()=>{
    if(!isPlaying) return; let raf=0; let last=performance.now();
    const tick=(now:number)=>{
      const dt=Math.min(0.1,(now-last)/1000); last=now;
      const viewport=scrollRef.current; const content=contentRef.current;
      if(viewport&&content){
        const max=Math.max(0,content.offsetHeight-viewport.clientHeight);
        if(max>0){
          // Float + deltaTime, tanpa floor/round/threshold: 0.25x = 9 px/detik tetap jalan.
          posRef.current=Math.min(max,posRef.current+dt*36*speedRef.current);
          content.style.transform=`translate3d(0,${-posRef.current}px,0)`;
          const p=posRef.current/max; setProgress(p);
          if(p>=0.999){ setGoFlash(false); setIsPlaying(false); setFinished(true); return; }
        }
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf);
  },[isPlaying]);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose(); if(e.key===' '){e.preventDefault(); togglePlay(); } if(e.key==='ArrowUp'){e.preventDefault();setSpeed(v=>Math.min(3,+(v+0.25).toFixed(2)))} if(e.key==='ArrowDown'){e.preventDefault();setSpeed(v=>Math.max(0.25,+(v-0.25).toFixed(2)))} }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey)},[isPlaying,finished,countdown]);
  function restart(){ setElapsed(0); setProgress(0); setGoFlash(false); posRef.current=0; setFinished(false); setIsPlaying(false); if(contentRef.current) contentRef.current.style.transform='translate3d(0,0px,0)'; start(); }
  function toggleFull(){ try{ if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }catch{} }

  return (
    <div className="fixed inset-0 z-[1300] overflow-hidden bg-black text-white pt-[max(0.75rem,var(--safe-area-inset-top))]">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-3 pb-4 sm:px-6">
        <div className="flex items-center gap-2 py-2">
          <div className="min-w-0 flex-1"><p className="truncate text-xs text-zinc-400">{effectiveLanguage(speech)} • {speech.event} • {formatTime(elapsed)} / ±{formatTime(totalSec)}</p><h2 className="truncate text-sm font-bold sm:text-base">{speech.title}</h2></div>
          <button onClick={toggleFull} className="rounded-full bg-white/10 p-2.5" aria-label="Layar penuh"><Maximize size={17}/></button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 -translate-y-1/2"><div className="h-[2px] w-full bg-amber-400"/></div>
          <div ref={scrollRef} className={`h-full w-full max-w-full overflow-hidden px-4 sm:px-10 ${mirror?'mirror':''}`} style={{boxSizing:'border-box'}}>
            <div ref={contentRef} className={`teleprompter-text ${isMandarin?'font-mandarin':'font-speech'} ${cjkHeavy?'is-cjk':''} mx-auto w-full max-w-full text-white`} style={{'--tele-font-size':`${effectiveFontSize}px`,fontSize:'var(--tele-font-size)',lineHeight:spacing,letterSpacing:0,wordSpacing:0,width:'100%',maxWidth:'100%',boxSizing:'border-box',padding:'16px 20px',paddingTop:'24vh',paddingBottom:'24vh',willChange:'transform',...cjkWrapStyle,whiteSpace:'pre-wrap',overflowX:'hidden',textAlign:cjkHeavy?'left':'center'} as React.CSSProperties}>
              <p className="mb-10 text-[0.55em] font-sans font-bold text-amber-300" style={{letterSpacing:0,wordSpacing:0,...cjkWrapStyle,whiteSpace:'pre-wrap',maxWidth:'100%'}}>{speech.title.toUpperCase()}</p>
              {speech.text.split('\n\n').map((p,i)=><p key={i} className="mb-[1em]" style={{letterSpacing:0,wordSpacing:0,...cjkWrapStyle,whiteSpace:'pre-wrap',maxWidth:'100%'}}>{p}</p>)}
              <p className="mt-16 text-amber-300" style={{letterSpacing:0,wordSpacing:0,...cjkWrapStyle,whiteSpace:'pre-wrap'}}>— Selesai —</p>
            </div>
          </div>
          {countdown!==null && countdown>0 && <div className="absolute inset-0 z-20 grid place-items-center bg-black/80"><div className="text-center"><div className="font-display text-[110px] font-black leading-none text-amber-400">{countdown}</div></div></div>}
          {goFlash && playing && <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center"><div className="text-center"><div className="font-display text-[64px] font-black leading-none text-amber-400 sm:text-[84px]">MULAI</div></div></div>}
          {finished && <div className="absolute inset-0 z-20 grid place-items-center bg-black/90 p-6 text-center"><div><h3 className="font-display text-4xl font-black">Selesai</h3><div className="mt-6 flex justify-center gap-3"><button onClick={restart} style={darkTeleBtnStyle} className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-black text-black"><RotateCcw size={17}/> Ulangi</button><button onClick={onClose} className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold">Kembali</button></div></div></div>}
          {null}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-[#171717] p-3 sm:p-4">
          {!playing && !finished && countdown===null && <button onClick={start} style={darkTeleBtnStyle} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-black text-black shadow-lg">▶ Mulai Membaca</button>}
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-400" style={{width:`${progress*100}%`}}/></div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} style={darkTeleBtnStyle} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-400 text-black" aria-label={playing?'Jeda':'Putar'}>{playing?<Pause size={22}/>:<Play size={22} className="ml-0.5"/>}</button>
              <button onClick={restart} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2.5 text-xs font-bold"><RotateCcw size={15}/> Restart</button>
              <button onClick={()=>setMirror(v=>!v)} className={`flex items-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold ${mirror?'bg-amber-400 text-black':'bg-white/10'}`}><MirrorIcon size={15}/> Mirror</button>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="rounded-xl bg-white/5 px-3 py-2.5"><span className="flex justify-between text-[11px] font-bold text-zinc-300"><span>KECEPATAN</span><b className="text-amber-300">{speed.toFixed(2)}x</b></span><input aria-label="Kecepatan" type="range" min="0.25" max="3" step="0.25" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="mt-1 w-full accent-amber-400"/></label>
              <label className="rounded-xl bg-white/5 px-3 py-2.5"><span className="flex justify-between gap-2 text-[11px] font-bold text-zinc-300"><span>UKURAN HURUF</span><b className="text-amber-300">{['Sangat Kecil','Kecil','Sedang','Besar','Sangat Besar'][fontIdx]} • {effectiveFontSize}px{cjkHeavy?' (Mandarin)':''}</b></span><input aria-label="Ukuran huruf" type="range" min="0" max="4" step="1" value={fontIdx} onChange={e=>setFontIdx(Number(e.target.value))} className="mt-1 w-full accent-amber-400"/></label>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold lg:shrink-0">Keluar</button>
          </div>
          <p className="mt-3 text-center text-[11px] text-zinc-500">Sisa ±{formatTime(remaining)}</p>
        </div>
      </div>
    </div>
  );
}
