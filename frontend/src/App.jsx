// ... (İmportların aynı kaldığını varsayıyorum, sadece step === 'CONFIRM' bloğunu güncelledim)

              {/* D. ONAY EKRANI */}
              {step === 'CONFIRM' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
                  <div className="border-b pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">Talep Özeti</span>
                    <h2 className="text-base font-bold text-neutral-950 mt-0.5">"{queryText}"</h2>
                    {selectedDisambiguation && (
                      <p className="text-xs text-neutral-500 mt-0.5 font-medium">Hedef: <span className="text-neutral-900">{selectedDisambiguation}</span></p>
                    )}
                  </div>

                  {/* Tekil Detaylar Menüsü */}
                  <div className="border rounded-xl overflow-hidden">
                    <div
                      onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
                      className="p-3.5 flex items-center justify-between cursor-pointer bg-neutral-50 hover:bg-neutral-100 select-none text-xs"
                    >
                      <span className="font-bold text-neutral-900">Talep detayları</span>
                      {isDetailsCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    </div>

                    {!isDetailsCollapsed && (
                      <div className="p-4 bg-white border-t space-y-4">
                        {/* Konum */}
                        <div>
                          <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1 flex items-center justify-between">
                            Konum Bilgisi
                            <button type="button" onClick={fetchCurrentLocation} className="text-blue-600 hover:underline">📍 Konumu Güncelle</button>
                          </label>
                          <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-neutral-50" />
                        </div>

                        {/* Aciliyet */}
                        <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-neutral-800">
                          <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-4 h-4" />
                          <Flame size={14} className={isUrgent ? 'text-rose-600' : 'text-neutral-400'} />
                          <span>Acil Hizmet Talebi</span>
                        </label>

                        {/* Tarih & Saat */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">En Son Tarih</label>
                            <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-neutral-50" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">En Son Saat</label>
                            <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-neutral-50" />
                          </div>
                        </div>

                        {/* Kanal */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1.5">İletişim Tercihi</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setPreferredChannel('PHONE')} className={`p-2 rounded border text-xs ${preferredChannel === 'PHONE' ? 'bg-black text-white' : ''}`}>Telefon</button>
                            <button type="button" onClick={() => setPreferredChannel('SMS')} className={`p-2 rounded border text-xs ${preferredChannel === 'SMS' ? 'bg-black text-white' : ''}`}>SMS</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dinamik Özet Kartı */}
                  <div className="p-3 bg-neutral-100 rounded-lg text-xs font-mono">
                    <p className="font-bold mb-1">Talep Bilgileri:</p>
                    <div className="flex flex-wrap gap-3">
                      <span>📍 {locationValue}</span>
                      {isUrgent && <span className="text-rose-700 font-bold">🔥 ACİL</span>}
                      {deadlineDate && <span>⏰ {deadlineDate} {deadlineTime}</span>}
                      <span>📞 {preferredChannel}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button onClick={() => setStep('INPUT')} className="w-1/3 py-2 border rounded-lg text-xs font-semibold">Geri</button>
                    <button onClick={handleCustomerFinalSubmit} disabled={loading} className="w-2/3 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold">
                      {loading ? 'Başlatılıyor...' : 'Talebi Onayla'}
                    </button>
                  </div>
                </div>
              )}