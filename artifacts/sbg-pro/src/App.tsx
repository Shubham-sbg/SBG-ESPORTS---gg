import { useEffect, useRef, lazy, Suspense } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import AdminGuard from "@/components/AdminGuard";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

const HomePage = lazy(() => import("@/pages/HomePage"));
const RosterPage = lazy(() => import("@/pages/RosterPage"));
const TournamentsPage = lazy(() => import("@/pages/TournamentsPage"));
const TournamentDetailPage = lazy(() => import("@/pages/TournamentDetailPage"));
const LivePage = lazy(() => import("@/pages/LivePage"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const PostDetailPage = lazy(() => import("@/pages/PostDetailPage"));
const HallOfFamePage = lazy(() => import("@/pages/HallOfFamePage"));
const JoinPage = lazy(() => import("@/pages/JoinPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const PlayerPortalPage = lazy(() => import("@/pages/PlayerPortalPage"));

// REQUIRED — copy verbatim
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
// REQUIRED — copy verbatim
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#ff6b00",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#0a0a14",
    colorInput: "#13131f",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#1e2035",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0a0a14] border border-[rgba(255,107,0,0.2)] rounded-xl w-[440px] max-w-full overflow-hidden shadow-[0_0_40px_rgba(255,107,0,0.1)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-semibold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-[#ff6b00] hover:text-[#ff8533]",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-[#ff6b00]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-400",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10",
    socialButtonsBlockButton: "bg-[#13131f] border border-[rgba(255,255,255,0.1)] hover:bg-[#1a1a2e]",
    formButtonPrimary: "bg-[#ff6b00] hover:bg-[#e55e00] text-white font-semibold",
    formFieldInput: "bg-[#13131f] border-[rgba(255,255,255,0.1)] text-white",
    footerAction: "border-t border-[rgba(255,255,255,0.06)]",
    dividerLine: "bg-[rgba(255,255,255,0.08)]",
    alert: "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)]",
    otpCodeFieldInput: "bg-[#13131f] border-[rgba(255,107,0,0.3)] text-white",
    formFieldRow: "",
    main: "",
  },
};

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#060611" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-inter">Loading...</p>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "linear-gradient(135deg, #060611 0%, #0d0d1a 50%, #060611 100%)" }}
    >
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={`${basePath}/logo.svg`} alt="SBG ARMY" className="h-12 mx-auto mb-4" />
          <h1 className="font-orbitron text-2xl font-bold text-white">WELCOME BACK</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your SBG ARMY account</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "linear-gradient(135deg, #060611 0%, #0d0d1a 50%, #060611 100%)" }}
    >
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={`${basePath}/logo.svg`} alt="SBG ARMY" className="h-12 mx-auto mb-4" />
          <h1 className="font-orbitron text-2xl font-bold text-white">JOIN SBG ARMY</h1>
          <p className="text-slate-400 text-sm mt-1">Create your account to get started</p>
        </div>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/admin">
        <AdminGuard>
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        </AdminGuard>
      </Route>
      <Route path="/staff">
        <Show when="signed-in">
          <Suspense fallback={<PageLoader />}>
            <StaffPage />
          </Suspense>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>
      <Route path="/player">
        <Show when="signed-in">
          <Layout>
            <Suspense fallback={<PageLoader />}><PlayerPortalPage /></Suspense>
          </Layout>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>
      <Route path="/">
        <Layout><Suspense fallback={<PageLoader />}><HomePage /></Suspense></Layout>
      </Route>
      <Route path="/roster">
        <Layout><Suspense fallback={<PageLoader />}><RosterPage /></Suspense></Layout>
      </Route>
      <Route path="/tournaments/:id">
        {(params) => (
          <Layout><Suspense fallback={<PageLoader />}><TournamentDetailPage id={Number(params.id)} /></Suspense></Layout>
        )}
      </Route>
      <Route path="/tournaments">
        <Layout><Suspense fallback={<PageLoader />}><TournamentsPage /></Suspense></Layout>
      </Route>
      <Route path="/live">
        <Layout><Suspense fallback={<PageLoader />}><LivePage /></Suspense></Layout>
      </Route>
      <Route path="/shop/:id">
        {(params) => (
          <Layout><Suspense fallback={<PageLoader />}><ProductDetailPage id={Number(params.id)} /></Suspense></Layout>
        )}
      </Route>
      <Route path="/shop">
        <Layout><Suspense fallback={<PageLoader />}><ShopPage /></Suspense></Layout>
      </Route>
      <Route path="/blog/:id">
        {(params) => (
          <Layout><Suspense fallback={<PageLoader />}><PostDetailPage id={Number(params.id)} /></Suspense></Layout>
        )}
      </Route>
      <Route path="/blog">
        <Layout><Suspense fallback={<PageLoader />}><BlogPage /></Suspense></Layout>
      </Route>
      <Route path="/hall-of-fame">
        <Layout><Suspense fallback={<PageLoader />}><HallOfFamePage /></Suspense></Layout>
      </Route>
      <Route path="/join">
        <Layout><Suspense fallback={<PageLoader />}><JoinPage /></Suspense></Layout>
      </Route>
      <Route path="/contact">
        <Layout><Suspense fallback={<PageLoader />}><ContactPage /></Suspense></Layout>
      </Route>
      <Route path="/privacy">
        <Layout><Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense></Layout>
      </Route>
      <Route path="/terms">
        <Layout><Suspense fallback={<PageLoader />}><TermsPage /></Suspense></Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome Back", subtitle: "Sign in to your SBG ARMY account" } },
        signUp: { start: { title: "Join SBG ARMY", subtitle: "Create your free account today" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
