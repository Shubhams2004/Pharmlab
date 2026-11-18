import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, Users, FileWarning, ClipboardCheck, Megaphone, BookHeart, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';

export default function PsychologyCommunicationModule() {
  const [activeTab, setActiveTab] = useState('roleplay');

  // 1. Role Play & Simulation State
  const [selectedScenario, setSelectedScenario] = useState('chronic');
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [empathyScore, setEmpathyScore] = useState(0);

  // 2. Case Study State
  const [activeCase, setActiveCase] = useState('mental_health');
  const [caseAnswer, setCaseAnswer] = useState({});

  // 3. Peer-to-Peer Practice (Paraphrasing + SBAR)
  const [paraphraseIdx, setParaphraseIdx] = useState(0);
  const [paraphraseChoice, setParaphraseChoice] = useState(null);
  const [sbar, setSbar] = useState({
    situation: 'Patient R.K., 64M, Ward 3B, experiencing acute dizziness and BP 88/54 mmHg after morning antihypertensive dose.',
    background: 'History of Stage 2 Hypertension and Type 2 Diabetes; prescribed Amlodipine 10 mg OD + Metformin 500 mg BD.',
    assessment: 'Suspected drug-induced orthostatic hypotension secondary to dose escalation.',
    recommendation: 'Hold afternoon vasodilator dose, elevate legs, monitor vitals every 15 mins, and request physician review.'
  });

  // 4. Community Engagement (IEC Material Designer)
  const [iecTopic, setIecTopic] = useState('Antimicrobial Resistance (AMR)');
  const [iecAudience, setIecAudience] = useState('Rural Community & Outpatients');
  const [iecKeyMsg, setIecKeyMsg] = useState('Complete your full prescribed antibiotic course. Never self-medicate or share leftover antibiotics.');
  const [iecTeachBack, setIecTeachBack] = useState('Can you tell me in your own words why we finish all antibiotic tablets even after fever stops?');

  // 5. Self-Reflection Log
  const [reflectionWeek, setReflectionWeek] = useState('Week 1');
  const [reflectionEmotion, setReflectionEmotion] = useState('Empathetic & Attentive');
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionLogs, setReflectionLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmlab_bp108p_reflections');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          week: 'Week 1',
          emotion: 'Calm & Empathetic',
          note: 'Practiced active listening during chronic diabetes counselling simulation; maintained eye contact and used teach-back method.',
          date: 'Initial Log'
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pharmlab_bp108p_reflections', JSON.stringify(reflectionLogs));
    } catch {
      // ignore storage quota errors
    }
  }, [reflectionLogs]);

  const rolePlayScenarios = {
    chronic: {
      title: 'Counselling a Patient with Chronic Illness (Type 2 Diabetes)',
      patientPrompt: '"I am tired of taking Metformin every single day. My sugar felt fine last week, so I stopped taking it for 4 days."',
      options: [
        {
          text: '"You are being irresponsible. Stopping your medicine will damage your kidneys."',
          score: 0,
          feedback: 'Judgmental and authoritative tone creates guilt and damages therapeutic alliance (Communication Barrier).'
        },
        {
          text: '"I hear how exhausting daily medication feels. When you feel fine, it is natural to wonder if you still need it. Can we talk about what happens silently to blood glucose and find an easier routine together?"',
          score: 100,
          feedback: 'Excellent empathetic validation + non-judgmental education + collaborative problem-solving (TTM/Motivational Interviewing).'
        },
        {
          text: '"Just take it twice a day after meals as the doctor wrote. Next patient please."',
          score: 25,
          feedback: 'Task-focused closed response; misses patient emotional barrier and adherence risk.'
        }
      ]
    },
    bad_news: {
      title: 'Breaking Bad News in a Clinical Setting (SPIKES Protocol)',
      patientPrompt: '"Wait... are my biopsy reports showing something serious? Please just tell me straight!"',
      options: [
        {
          text: '"Yes, it is malignant. Here is the file, go see the oncologist on floor 3."',
          score: 10,
          feedback: 'Violates SPIKES (no Warning Shot, no Empathy, no Strategy/Summary). Causes acute psychological shock.'
        },
        {
          text: '"Let us sit down somewhere quiet first. Before I share the results, could you tell me what you already understand about why this test was done? ... I am sorry to share that the results show concerning abnormal cells, and I am right here to walk through our next steps with you."',
          score: 100,
          feedback: 'Follows SPIKES: Setting -> Perception -> Invitation -> Knowledge (warning shot) -> Empathy -> Strategy & Summary.'
        },
        {
          text: '"Don\'t worry, everything will be totally fine, don\'t think about it."',
          score: 20,
          feedback: 'False reassurance undermines trust and avoids honest, compassionate clinical disclosure.'
        }
      ]
    },
    crisis: {
      title: 'Empathetic Listening in Crisis Response (Acute Panic / Adverse Drug Fear)',
      patientPrompt: '"My chest is racing and I feel dizzy after taking the new inhaler! Am I going to die?!"',
      options: [
        {
          text: '"Calm down, you are overreacting, salbutamol always causes palpitations."',
          score: 15,
          feedback: 'Dismissive language invalidates panic and escalates sympathetic arousal.'
        },
        {
          text: '"You are safe right now, and I am staying with you. Let us sit down and take one slow breath together. Tell me exactly when you took the puff while I check your pulse and vitals."',
          score: 100,
          feedback: 'Applies Psychological First Aid (PFA): Grounding, safety assurance, calm pacing, and simultaneous clinical triage.'
        },
        {
          text: '"Wait outside in the lobby until the physician finishes rounds."',
          score: 0,
          feedback: 'Unsafe abandonment during acute physiological/psychological distress.'
        }
      ]
    }
  };

  const caseStudies = {
    mental_health: {
      title: 'Case 1: Mental Health in Primary Care (Somatization & Masked Depression)',
      vignette: 'A 38-year-old female visits the community pharmacy repeatedly over 6 weeks requesting OTC analgesics and antacids for vague headaches, fatigue, and insomnia. She appears withdrawn, avoids eye contact, and mentions "nothing feels worthwhile anymore."',
      questions: [
        {
          id: 'mh1',
          q: 'Which psychological presentation is most consistent with her recurring physical complaints without organic relief?',
          choices: ['Somatization linked with underlying depressive disorder', 'Acute bacterial gastritis', 'Malingering for narcotics'],
          correct: 0
        },
        {
          id: 'mh2',
          q: 'What is the pharmacist\'s most appropriate primary-care intervention?',
          choices: [
            'Dispense stronger NSAIDs and ignore emotional cues',
            'Use empathetic active listening, assess red-flag self-harm risk gently, avoid stigma, and coordinate prompt primary care/mental health referral',
            'Tell her the pain is imaginary'
          ],
          correct: 1
        }
      ]
    },
    med_error: {
      title: 'Case 2: Impact of Miscommunication in Healthcare Errors (LASA & Incomplete Counseling)',
      vignette: 'An elderly patient with poor eyesight receives Hydralazine 25 mg instead of Hydroxyzine 25 mg due to hurried verbal handover and illegible handwriting without Tall-Man lettering or patient teach-back.',
      questions: [
        {
          id: 'me1',
          q: 'Which communication failure directly enabled this Look-Alike Sound-Alike (LASA) dispensing error?',
          choices: [
            'Absence of read-back verification, Tall-Man lettering, and indication-based patient counseling',
            'Too much time spent on empathy',
            'Use of printed labels'
          ],
          correct: 0
        },
        {
          id: 'me2',
          q: 'How should the error be disclosed ethically once caught?',
          choices: [
            'Hide it from the patient to avoid panic',
            'Blame the prescriber in front of the patient',
            'Transparent, prompt disclosure with clinical monitoring, apology, and root-cause corrective action'
          ],
          correct: 2
        }
      ]
    }
  };

  const paraphrasePrompts = [
    {
      statement: '"Every time I take this blood pressure pill in the morning, I feel so lightheaded at work that I am scared I might faint in front of my coworkers."',
      options: [
        { text: '"So you should just take it at night instead."', ok: false, reason: 'Gives premature advice instead of reflecting feelings & meaning.' },
        { text: '"It sounds like the morning dizziness makes you anxious about losing control at work, which makes taking the medicine stressful."', ok: true, reason: 'Accurate reflective listening: captures both content (dizziness at work) and emotion (fear/anxiety).' }
      ]
    },
    {
      statement: '"My mother refuses to listen to anyone about her inhaler technique, and I feel completely helpless trying to care for her."',
      options: [
        { text: '"You are feeling overwhelmed and frustrated because you want to keep your mother safe, yet she resists your help."', ok: true, reason: 'Validates caregiver burnout and reflects core emotional conflict.' },
        { text: '"Older patients are always stubborn, don\'t take it personally."', ok: false, reason: 'Stereotyping dismisses caregiver emotion.' }
      ]
    }
  ];

  const handleAddReflection = (e) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    const newEntry = {
      id: Date.now(),
      week: reflectionWeek,
      emotion: reflectionEmotion,
      note: reflectionText.trim(),
      date: new Date().toLocaleDateString()
    };
    setReflectionLogs([newEntry, ...reflectionLogs]);
    setReflectionText('');
  };

  const activeRolePlay = rolePlayScenarios[selectedScenario];
  const activeCaseData = caseStudies[activeCase];
  const activeParaphrase = paraphrasePrompts[paraphraseIdx];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">PCI B.Pharm • BP103T / BP108P • Practical Suite</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Healthcare Psychology &amp; Communication Skills Lab</h2>
        <p className="text-slate-400 text-sm mt-1">
          Interactive clinical role-plays (SPIKES, chronic care, crisis PFA), primary care case studies, SBAR &amp; paraphrasing practice, IEC designer, and reflective logs.
        </p>
      </div>

      {/* Navigation Tabs matching BP108P 5 Practical Groups */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'roleplay', label: '1. Role Plays & Simulations' },
          { id: 'cases', label: '2. Case Study Discussions' },
          { id: 'peer', label: '3. Peer Practice (Paraphrasing & SBAR)' },
          { id: 'community', label: '4. Community IEC & Health Ed' },
          { id: 'journal', label: '5. Self-Reflection Logs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ROLE PLAYS */}
      {activeTab === 'roleplay' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <MessageSquareHeart className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Clinical Role-Play Simulator</h3>
                <p className="text-xs text-slate-400">Select a BP108P scenario and choose the most therapeutic response.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              Empathy Score: {empathyScore}%
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'chronic', label: 'Counselling Chronic Illness' },
              { id: 'bad_news', label: 'Breaking Bad News (SPIKES)' },
              { id: 'crisis', label: 'Empathetic Crisis Listening' }
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => { setSelectedScenario(sc.id); setSelectedChoice(null); setStepIndex(stepIndex + 1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                  selectedScenario === sc.id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-emerald-400">{activeRolePlay.title}</h4>
            <div className="bg-slate-900 border-l-4 border-blue-500 p-4 rounded-r-xl text-sm text-slate-200 italic">
              Patient says: {activeRolePlay.patientPrompt}
            </div>
            <div className="space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Select Your Response:</span>
              {activeRolePlay.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedChoice(idx); setEmpathyScore(opt.score); }}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                    selectedChoice === idx
                      ? opt.score === 100
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                        : 'bg-amber-500/15 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {selectedChoice !== null && (
              <div className={`p-4 rounded-xl border text-xs ${
                activeRolePlay.options[selectedChoice].score === 100
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                <strong>Clinical Communication Feedback:</strong> {activeRolePlay.options[selectedChoice].feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CASE STUDIES */}
      {activeTab === 'cases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <FileWarning className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Case Study Discussions (BP108P)</h3>
              <p className="text-xs text-slate-400">Analyze mental health presentations in primary care and healthcare miscommunication errors.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCase('mental_health')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                activeCase === 'mental_health' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Mental Health in Primary Care
            </button>
            <button
              onClick={() => setActiveCase('med_error')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                activeCase === 'med_error' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Impact of Miscommunication in Errors
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
            <h4 className="text-sm font-bold text-white">{activeCaseData.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-4 rounded-xl border border-slate-800">
              {activeCaseData.vignette}
            </p>
            <div className="space-y-4">
              {activeCaseData.questions.map((item) => (
                <div key={item.id} className="space-y-2">
                  <p className="text-xs font-semibold text-blue-300">{item.q}</p>
                  <div className="space-y-1.5">
                    {item.choices.map((ch, idx) => {
                      const picked = caseAnswer[item.id];
                      const isCorrect = idx === item.correct;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCaseAnswer({ ...caseAnswer, [item.id]: idx })}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-all ${
                            picked === idx
                              ? isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PEER-TO-PEER PRACTICE */}
      {activeTab === 'peer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Users className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Reflective Listening &amp; Paraphrasing Lab</h3>
            </div>
            <div className="flex gap-2">
              {paraphrasePrompts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setParaphraseIdx(i); setParaphraseChoice(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    paraphraseIdx === i ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Prompt #{i + 1}
                </button>
              ))}
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 italic">
              {activeParaphrase.statement}
            </div>
            <div className="space-y-2">
              {activeParaphrase.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setParaphraseChoice(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs ${
                    paraphraseChoice === idx
                      ? opt.ok
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                        : 'bg-rose-500/15 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {paraphraseChoice !== null && (
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {activeParaphrase.options[paraphraseChoice].reason}
              </p>
            )}
          </div>

          {/* SBAR Interdisciplinary Team Handover */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-blue-400">
              <ClipboardCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Team Decision-Making: SBAR Clinical Handover</h3>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { key: 'situation', label: 'S — Situation' },
                { key: 'background', label: 'B — Background' },
                { key: 'assessment', label: 'A — Assessment' },
                { key: 'recommendation', label: 'R — Recommendation' }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-emerald-400 font-semibold mb-1">{field.label}</label>
                  <textarea
                    rows={2}
                    value={sbar[field.key]}
                    onChange={(e) => setSbar({ ...sbar, [field.key]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. COMMUNITY ENGAGEMENT */}
      {activeTab === 'community' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Community IEC Material &amp; Mock Health Education Builder</h3>
              <p className="text-xs text-slate-400">Design culturally inclusive Information, Education &amp; Communication (IEC) pamphlets with Teach-Back verification.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Public Health Campaign Topic</label>
                <select value={iecTopic} onChange={(e) => setIecTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white">
                  <option>Antimicrobial Resistance (AMR)</option>
                  <option>Hypertension &amp; Low-Sodium Adherence</option>
                  <option>Mental Health Stigma Reduction</option>
                  <option>ORS Preparation &amp; Diarrheal Care</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Audience</label>
                <input type="text" value={iecAudience} onChange={(e) => setIecAudience(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Core Actionable Health Message (Plain Language)</label>
                <textarea rows={3} value={iecKeyMsg} onChange={(e) => setIecKeyMsg(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Teach-Back Check Question</label>
                <input type="text" value={iecTeachBack} onChange={(e) => setIecTeachBack(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>

            <div className="lg:col-span-7 bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  IEC Community Leaflet Preview
                </span>
                <h4 className="text-2xl font-extrabold text-white mt-3">{iecTopic}</h4>
                <p className="text-xs text-emerald-300 mt-1">Audience: {iecAudience}</p>
                <div className="mt-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 leading-relaxed">
                  {iecKeyMsg}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-4 text-xs space-y-1">
                <span className="font-bold text-blue-400 uppercase text-[10px]">Mock Session Teach-Back Prompt</span>
                <p className="text-slate-200">"{iecTeachBack}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SELF-REFLECTION LOGS */}
      {activeTab === 'journal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <BookHeart className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Journaling &amp; Self-Reflection Log</h3>
              <p className="text-xs text-slate-400">Record emotional responses during care simulations and track semester communication growth.</p>
            </div>
          </div>

          <form onSubmit={handleAddReflection} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Practical Week</label>
                <select value={reflectionWeek} onChange={(e) => setReflectionWeek(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'].map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Dominant Emotional Response</label>
                <select value={reflectionEmotion} onChange={(e) => setReflectionEmotion(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white">
                  <option>Empathetic &amp; Attentive</option>
                  <option>Initially Nervous, Then Confident</option>
                  <option>Challenged by Patient Distress</option>
                  <option>Reflective &amp; Grounded</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reflection Entry (What went well, barriers noticed, growth plan)</label>
              <textarea
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Describe your emotional response and communication insights from today's simulation..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Save Reflection Entry</span>
            </button>
          </form>

          <div className="space-y-3">
            {reflectionLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">{log.week} &bull; {log.emotion}</span>
                  <span className="text-slate-500 font-mono">{log.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{log.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
