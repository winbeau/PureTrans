type ProblemItem = {
  title: string;
  description: string;
  solution: string;
};

type FeatureItem = {
  title: string;
  eyebrow: string;
  description: string;
  points: string[];
  preview: string;
};

type UseCaseItem = {
  title: string;
  description: string;
  details: string[];
};

const repoUrl = 'https://github.com/winbeau/PureTrans';
const releasesUrl = 'https://github.com/winbeau/PureTrans/releases';
const contactEmail = 'contact@winbeau.top';

const problemItems: ProblemItem[] = [
  {
    title: '专名幻觉',
    description: '地名、人名、机构名和政策术语容易被模型按通用语料猜测，导致译文看似流畅但事实错误。',
    solution: '清译把本地知识检索结果与模型输出分层展示，让关键专名有来源、有依据、可复核。',
  },
  {
    title: '文化语境偏差',
    description: '民族文化、历史背景和地区表达在跨语言转换中经常被简化，影响传播准确性与接受度。',
    solution: '通过显式上下文、领域标签和引用片段，帮助译者判断哪些表达需要保留、解释或改写。',
  },
  {
    title: '盲目依赖',
    description: '单次生成的译文很难暴露不确定性，使用者容易把模型判断误认为确定事实。',
    solution: '提供对比翻译、译文校验和歧义提示，把不确定点从模型内部移到用户可见界面。',
  },
];

const featureItems: FeatureItem[] = [
  {
    eyebrow: 'Local RAG',
    title: '新疆本地知识库',
    description: '围绕地名、政策、文化、旅游、商贸等高频场景组织可追溯知识，辅助模型理解区域语境。',
    points: ['来源 ID、标题、片段与领域标签可见', '检索知识与模型推断明确区分', '后端统一封装 RAG 与 Dify 工作流'],
    preview: '引用可追溯',
  },
  {
    eyebrow: 'Verification',
    title: '多维对比与译文校验',
    description: '把直接翻译、知识库翻译、对比评估和译文检查串成同一个工作流，减少只看单一结果的风险。',
    points: ['支持直接翻译与知识增强翻译对照', '突出一致性、遗漏、术语和语气问题', '为教学与审核保留请求 ID 和错误状态'],
    preview: '差异可解释',
  },
  {
    eyebrow: 'Human Control',
    title: '伦理干预与术语适配',
    description: '在敏感、跨文化或高风险内容中，把用户提供的上下文和术语约束作为一等输入，而不是事后补丁。',
    points: ['显式采集使用场景和目标语域', '把歧义、风险和替代表达呈现给用户', '适配高校、文旅、商贸等不同话语风格'],
    preview: '人机共审',
  },
];

const useCaseItems: UseCaseItem[] = [
  {
    title: '高校教学',
    description: '面向翻译教学、双语材料准备和课堂案例分析，保留上下文与校验过程。',
    details: ['术语对照', '错误分析', '课堂复盘'],
  },
  {
    title: '文旅传播',
    description: '辅助景区介绍、非遗内容、城市推介和多语种宣传，兼顾准确性与可读性。',
    details: ['地名规范', '文化说明', '语气适配'],
  },
  {
    title: '跨境商贸',
    description: '支持商品介绍、沟通文本和政策术语翻译，让本地知识与业务语境进入译文决策。',
    details: ['商贸术语', '政策表达', '风险提示'],
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PortalNav />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <CoreFeaturesSection />
        <UseCasesSection />
        <AboutSection />
      </main>
      <PortalFooter />
    </div>
  );
}

function PortalNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="/" className="flex min-w-0 items-center gap-3" aria-label="清译 PureTrans 首页">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">清译 PureTrans</p>
            <p className="hidden text-xs text-slate-500 sm:block">Context-aware AI translation</p>
          </div>
        </a>
        <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <a className="hover:text-teal-700" href="#features">
            核心功能
          </a>
          <a className="hover:text-teal-700" href="#use-cases">
            应用场景
          </a>
          <a className="hover:text-teal-700" href="#about">
            关于项目
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <a
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700"
            href="/demo"
          >
            Web 演示
          </a>
          <a
            className="hidden rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 sm:inline-flex"
            href={releasesUrl}
            rel="noreferrer"
            target="_blank"
          >
            下载客户端
          </a>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-teal-100 bg-teal-700 text-sm font-semibold text-white shadow-sm">
      PT
    </span>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-teal-700">面向新疆本地语境的 AI 翻译应用</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">清译 PureTrans</h1>
          <h2 className="mt-4 text-xl font-medium leading-8 text-slate-700 sm:text-2xl">
            让 AI 翻译看见上下文、来源与不确定性。
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            清译结合显式上下文捕获、本地知识库检索和译文校验，服务高校教学、文旅传播和跨境商贸等需要准确表达的场景。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
              href="/demo"
            >
              打开 Web 版演示
            </a>
            <a
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-200 hover:text-teal-700"
              href={releasesUrl}
              rel="noreferrer"
              target="_blank"
            >
              下载客户端
            </a>
          </div>
        </div>
        <BrowserMockup />
      </div>
    </section>
  );
}

function BrowserMockup() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-subtle">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          puretrans.winbeau.top/demo
        </span>
      </div>
      <div className="grid gap-4 bg-slate-50 p-4 sm:grid-cols-[0.82fr_1.18fr] sm:p-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-semibold text-teal-700">知识库翻译</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">输入上下文</p>
            </div>
            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">RAG 开启</span>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              请翻译一段包含新疆地名、文化背景和政策表达的介绍文本。
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="rounded-md border border-slate-200 bg-white px-2 py-2">中文到英文</span>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-2">文旅传播</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white">已校验</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">3 条引用</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">1 处歧义</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              The translation preserves the local place name and adds context where direct wording may be ambiguous.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {['来源片段', '术语建议', '不确定性'].map((label) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-900">{label}</p>
                  <p className="mt-2 h-10 text-xs leading-5 text-slate-500">保留出处与判断依据，便于审核。</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSolutionSection() {
  return (
    <section className="border-b border-slate-200" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-teal-700">Problem & Solution</p>
          <h2 id="problem-heading" className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            把翻译风险暴露在工作流里。
          </h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {problemItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm leading-6 text-teal-900">
                {item.solution}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreFeaturesSection() {
  return (
    <section id="features" className="border-b border-slate-200 bg-white" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-teal-700">Core Features</p>
          <h2 id="features-heading" className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            从检索、生成到校验的完整闭环。
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {featureItems.map((item, index) => (
            <FeatureBlock key={item.title} item={item} reversed={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({ item, reversed }: { item: FeatureItem; reversed: boolean }) {
  return (
    <article className="grid gap-5 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm md:grid-cols-2 md:p-6">
      <div className={reversed ? 'md:order-2' : ''}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{item.eyebrow}</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
        <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-700">
          {item.points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reversed ? 'md:order-1' : ''}>
        <div className="h-full rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">{item.preview}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">PureTrans</span>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-3 w-4/5 rounded-full bg-slate-200" />
            <div className="h-3 w-3/5 rounded-full bg-slate-200" />
            <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
              <div className="h-3 w-24 rounded-full bg-teal-200" />
              <div className="mt-3 h-14 rounded-md bg-white/80" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />
              <div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />
              <div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="border-b border-slate-200" aria-labelledby="use-cases-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-teal-700">Use Cases</p>
          <h2 id="use-cases-heading" className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            服务需要语境判断的真实翻译场景。
          </h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {useCaseItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.details.map((detail) => (
                  <span
                    key={detail}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="bg-white" aria-labelledby="about-heading">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold text-teal-700">About</p>
          <h2 id="about-heading" className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            一个面向开放审核与持续演进的翻译项目。
          </h2>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          <p>
            PureTrans / 清译聚焦上下文感知、语音翻译和新疆本地化知识库三类能力。当前 Web 版用于展示核心工作流与接口形态，Android
            客户端将围绕低摩擦输入、语音交互和移动端审核体验继续迭代。
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="项目背景" value="AI 翻译的上下文捕获、检索增强与不确定性呈现" />
            <InfoRow label="团队" value="PureTrans Project Team" />
            <InfoRow label="联系邮箱" value={contactEmail} href={`mailto:${contactEmail}`} />
            <InfoRow label="GitHub 仓库" value="winbeau/PureTrans" href={repoUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const target = href?.startsWith('http') ? '_blank' : undefined;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {href ? (
        <a className="mt-1 block break-words text-sm font-medium text-teal-700 hover:text-teal-800" href={href} rel="noreferrer" target={target}>
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p>
      )}
    </div>
  );
}

function PortalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-white">清译 PureTrans</p>
          <p className="mt-1 text-slate-400">项目背景：上下文感知 AI 翻译与新疆本地化知识库。</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-slate-400">
          <span>团队：PureTrans Project Team</span>
          <a className="hover:text-white" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          <a className="hover:text-white" href={repoUrl} rel="noreferrer" target="_blank">
            GitHub
          </a>
          <span>ICP备案号：[待填]</span>
        </div>
      </div>
    </footer>
  );
}
