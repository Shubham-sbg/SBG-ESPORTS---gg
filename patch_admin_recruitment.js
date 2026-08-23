const fs = require('fs');
const file = 'artifacts/sbg-army/src/components/admin/AdminRecruitment.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetGrid = `<div className="grid grid-cols-2 gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Game</div>
                        <div className="text-white font-semibold">{selectedApp.game}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Role</div>
                        <div className="text-white font-semibold">{selectedApp.role}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">In-Game UID</div>
                        <div className="text-amber-400 font-mono font-bold">{selectedApp.uid || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Current Rank</div>
                        <div className="text-white">{selectedApp.rank || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Phone / WhatsApp</div>
                        <div className="text-white">{selectedApp.whatsapp || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Country</div>
                        <div className="text-white">{selectedApp.country || 'India'}</div>
                      </div>
                    </div>`;

const newGrid = `<div className="grid grid-cols-2 gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Game</div>
                        <div className="text-white font-semibold">{selectedApp.game}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Role</div>
                        <div className="text-white font-semibold">{selectedApp.role}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Age</div>
                        <div className="text-white font-semibold">{selectedApp.age || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Experience (Years)</div>
                        <div className="text-white font-semibold">{selectedApp.experienceYears || '0'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">In-Game UID</div>
                        <div className="text-amber-400 font-mono font-bold">{selectedApp.uid || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Current Rank</div>
                        <div className="text-white">{selectedApp.rank || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Current Org</div>
                        <div className="text-white">{selectedApp.currentOrg || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Availability</div>
                        <div className="text-white">{selectedApp.availability || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Phone / WhatsApp</div>
                        <div className="text-white">{selectedApp.whatsapp || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Country</div>
                        <div className="text-white">{selectedApp.country || 'India'}</div>
                      </div>
                    </div>`;

content = content.replace(targetGrid, newGrid);
fs.writeFileSync(file, content);
