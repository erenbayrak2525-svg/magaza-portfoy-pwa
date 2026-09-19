"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import {
  mesajGonder,
  mesajKonusmaIdsi,
  mesajlariOkunduIsaretle,
  useCanliMesajKonusmalari,
  useCanliMesajlar
} from "@/lib/mesajlar";
import { MOCK_KULLANICILAR } from "@/data/mockData";
import { adSoyadBul } from "@/lib/adSoyadBul";
import type { Kullanici } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

const ROL_ETIKET: Record<string, string> = {
  personel: "Personel",
  bolge_muduru: "Müdür",
  admin: "Admin"
};

export default function MesajlarSayfasi() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>}>
      <MesajlarIcerik />
    </Suspense>
  );
}

function MesajlarIcerik() {
  const router = useRouter();
  const params = useSearchParams();
  const kullanici = useAuthStore((s) => s.kullanici);
  const seciliParametre = params.get("konusma");
  const [seciliKonusmaId, setSeciliKonusmaId] = useState<string | null>(seciliParametre);
  const [yeniMesajAcik, setYeniMesajAcik] = useState(false);
  const [profilArama, setProfilArama] = useState("");
  const [girdi, setGirdi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const sonMesajRef = useRef<HTMLDivElement>(null);

  const { veri: canliProfiller, yukleniyor: profillerYukleniyor } = useFirestoreListesi<Kullanici>("profiles");
  const { veri: konusmalar, okunmamis, yukleniyor: konusmalarYukleniyor, hata: konusmaHatasi } =
    useCanliMesajKonusmalari(kullanici?.id);
  const { veri: mesajlar, yukleniyor: mesajlarYukleniyor, hata: mesajHatasi } = useCanliMesajlar(
    seciliKonusmaId ?? undefined
  );

  const profiller = firebaseYapilandirildi ? canliProfiller : MOCK_KULLANICILAR;
  const hedefler = profiller.filter((profil) => profil.id !== kullanici?.id);
  const seciliKonusma = konusmalar.find((konusma) => konusma.id === seciliKonusmaId);
  const seciliAlici = useMemo(() => {
    if (!seciliKonusmaId || !kullanici) return null;
    const aliciId = seciliKonusma?.katilimcilar.find((id) => id !== kullanici.id) ??
      hedefler.find((profil) => mesajKonusmaIdsi(kullanici.id, profil.id) === seciliKonusmaId)?.id;
    return hedefler.find((profil) => profil.id === aliciId) ?? null;
  }, [hedefler, kullanici, seciliKonusma, seciliKonusmaId]);

  useEffect(() => {
    if (seciliParametre !== seciliKonusmaId) setSeciliKonusmaId(seciliParametre);
  }, [seciliParametre, seciliKonusmaId]);

  useEffect(() => {
    sonMesajRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, seciliKonusmaId]);

  useEffect(() => {
    if (!seciliKonusma || !kullanici || !seciliKonusma.okunmamisSayilari?.[kullanici.id]) return;
    mesajlariOkunduIsaretle(seciliKonusma.id, kullanici.id).catch(() => {});
  }, [kullanici, seciliKonusma]);

  if (!kullanici) return null;

  function konusmayiAc(id: string) {
    setSeciliKonusmaId(id);
    setYeniMesajAcik(false);
    setHata(null);
    router.replace(`/mesajlar?konusma=${encodeURIComponent(id)}`, { scroll: false });
  }

  function yeniKonusmaBaslat(id: string) {
    if (!kullanici) return;
    konusmayiAc(mesajKonusmaIdsi(kullanici.id, id));
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!kullanici || !seciliKonusmaId || !seciliAlici || !girdi.trim()) return;
    setGonderiliyor(true);
    setHata(null);
    try {
      await mesajGonder({
        konusmaId: seciliKonusmaId,
        gonderenId: kullanici.id,
        gonderenAdi: kullanici.adSoyad,
        aliciId: seciliAlici.id,
        aliciAdi: adSoyadBul(seciliAlici) || seciliAlici.id,
        icerik: girdi,
        mevcutKonusma: seciliKonusma
      });
      setGirdi("");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Mesaj gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  }

  const filtrelenmisHedefler = hedefler.filter((profil) => {
    const q = profilArama.trim().toLocaleLowerCase("tr-TR");
    return !q || (adSoyadBul(profil) || profil.id).toLocaleLowerCase("tr-TR").includes(q) ||
      ROL_ETIKET[profil.rol]?.toLocaleLowerCase("tr-TR").includes(q);
  });

  const seciliBaslik = seciliAlici
    ? adSoyadBul(seciliAlici) || seciliAlici.id
    : seciliKonusma?.katilimciAdlari?.[seciliKonusma.katilimcilar.find((id) => id !== kullanici.id) ?? ""] ?? "Yeni konuşma";

  return (
    <div className="space-y-3">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Mesajlaşmanın çalışması için Firebase bağlantısı gerekli.</p>
        </Kart>
      )}

      <div className={`grid gap-3 ${seciliKonusmaId ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]" : ""}`}>
        <section className={seciliKonusmaId ? "hidden md:block" : "block"}>
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <h2 className="text-sm font-semibold">Mesajlar</h2>
              <p className="text-xs text-gray-500">{okunmamis > 0 ? `${okunmamis} okunmamış mesaj` : "Ekip konuşmaları"}</p>
            </div>
            <Buton varyant="ikincil" onClick={() => setYeniMesajAcik((acik) => !acik)}>
              + Yeni
            </Buton>
          </div>

          {yeniMesajAcik && (
            <Kart className="mb-3">
              <p className="text-sm font-medium mb-2">Kime mesaj göndereceksin?</p>
              <input
                value={profilArama}
                onChange={(e) => setProfilArama(e.target.value)}
                placeholder="İsim veya rol ara…"
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm mb-2"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {profillerYukleniyor ? (
                  <p className="text-xs text-gray-500 py-2">Çalışanlar yükleniyor…</p>
                ) : filtrelenmisHedefler.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">Eşleşen kullanıcı yok.</p>
                ) : (
                  filtrelenmisHedefler.map((profil) => (
                    <button
                      key={profil.id}
                      type="button"
                      onClick={() => yeniKonusmaBaslat(profil.id)}
                      className="focus-ring w-full flex items-center gap-2 text-left rounded-lg px-2.5 py-2 hover:bg-canvas"
                    >
                      <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-semibold">
                        {(adSoyadBul(profil) || "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm truncate">{adSoyadBul(profil) || profil.id}</span>
                        <span className="block text-[11px] text-gray-500">{ROL_ETIKET[profil.rol] || profil.rol}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Kart>
          )}

          {konusmalarYukleniyor ? (
            <p className="text-sm text-gray-500 text-center py-10">Konuşmalar yükleniyor…</p>
          ) : konusmaHatasi ? (
            <Kart stripRengi="#C4341E"><p className="text-sm text-signal-late">{konusmaHatasi}</p></Kart>
          ) : konusmalar.length === 0 ? (
            <Kart>
              <p className="text-sm text-gray-500">Henüz konuşma yok.</p>
              <p className="text-xs text-gray-400 mt-1">+ Yeni düğmesine dokunarak ekipten birini seç.</p>
            </Kart>
          ) : (
            <div className="space-y-2">
              {konusmalar.map((konusma) => {
                const digerId = konusma.katilimcilar.find((id) => id !== kullanici.id) ?? "";
                const digerAd = konusma.katilimciAdlari?.[digerId] || digerId;
                const okunmamisMesaj = konusma.okunmamisSayilari?.[kullanici.id] ?? 0;
                return (
                  <button
                    key={konusma.id}
                    type="button"
                    onClick={() => konusmayiAc(konusma.id)}
                    className={`focus-ring w-full text-left ${seciliKonusmaId === konusma.id ? "ring-2 ring-brand-300" : ""}`}
                  >
                    <Kart>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-semibold shrink-0">
                          {digerAd.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${okunmamisMesaj ? "font-semibold" : "font-medium"}`}>{digerAd}</p>
                            {okunmamisMesaj > 0 && <span className="rounded-full bg-signal-late text-white text-[10px] min-w-5 h-5 px-1 flex items-center justify-center">{okunmamisMesaj}</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{konusma.sonMesaj || "Yeni konuşma"}</p>
                        </div>
                      </div>
                    </Kart>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {seciliKonusmaId && (
          <section className="flex flex-col min-h-[calc(100vh-11rem)]">
            <div className="flex items-center gap-2 border-b border-line pb-3 mb-3">
              <button type="button" onClick={() => { setSeciliKonusmaId(null); router.replace("/mesajlar", { scroll: false }); }} className="md:hidden focus-ring text-xl text-gray-500">‹</button>
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-semibold">
                {seciliBaslik.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{seciliBaslik}</p>
                {seciliAlici && <p className="text-[11px] text-gray-500">{ROL_ETIKET[seciliAlici.rol] || seciliAlici.rol}</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pb-3">
              {mesajlarYukleniyor ? (
                <p className="text-sm text-gray-500 text-center py-10">Mesajlar yükleniyor…</p>
              ) : mesajHatasi ? (
                <Kart stripRengi="#C4341E"><p className="text-sm text-signal-late">{mesajHatasi}</p></Kart>
              ) : mesajlar.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">Bu konuşmada henüz mesaj yok. İlk mesajı gönder.</p>
              ) : (
                mesajlar.map((mesaj) => (
                  <div key={mesaj.id} className={`flex ${mesaj.gonderenId === kullanici.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${mesaj.gonderenId === kullanici.id ? "bg-brand-500 text-white rounded-br-md" : "bg-surface border border-line rounded-bl-md"}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{mesaj.icerik}</p>
                      <p className={`text-[10px] mt-1 ${mesaj.gonderenId === kullanici.id ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(mesaj.tarih).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={sonMesajRef} />
            </div>

            {hata && <p className="text-xs text-signal-late mb-2">{hata}</p>}
            <form onSubmit={gonder} className="flex gap-2 border-t border-line pt-2">
              <textarea
                value={girdi}
                onChange={(e) => setGirdi(e.target.value)}
                rows={1}
                maxLength={2000}
                placeholder={seciliAlici ? "Mesajını yaz…" : "Kullanıcı listesi yükleniyor…"}
                className="focus-ring flex-1 resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm"
                disabled={!seciliAlici || gonderiliyor}
              />
              <Buton type="submit" disabled={!seciliAlici || !girdi.trim() || gonderiliyor}>
                {gonderiliyor ? "…" : "Gönder"}
              </Buton>
            </form>
          </section>
        )}
      </div>

      <Link href="/bildirimler" className="block text-center text-xs text-brand-500 underline pt-2">
        Bildirim kutusunu aç
      </Link>
    </div>
  );
}
