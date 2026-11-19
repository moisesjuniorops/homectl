import { useEffect, useState } from "react";
import { ActionIcon, AppShell, Group, NavLink, Stack, Text, ThemeIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import {
  IconBasket, IconChecklist, IconHome, IconMoon, IconPackage, IconReceipt, IconSun, IconWallet,
} from "@tabler/icons-react";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Shopping from "./pages/Shopping.jsx";
import Tasks from "./pages/Tasks.jsx";
import Bills from "./pages/Bills.jsx";
import Finance from "./pages/Finance.jsx";

export const PAGES = [
  { key: "home", label: "Início", icon: IconHome, color: "teal", Page: Dashboard },
  { key: "shopping", label: "Compras", icon: IconBasket, color: "orange", Page: Shopping },
  { key: "tasks", label: "Tarefas", icon: IconChecklist, color: "violet", Page: Tasks },
  { key: "inventory", label: "Despensa", icon: IconPackage, color: "cyan", Page: Inventory },
  { key: "bills", label: "Contas", icon: IconReceipt, color: "red", Page: Bills },
  { key: "finance", label: "Finanças", icon: IconWallet, color: "green", Page: Finance },
];

const fromHash = () => (PAGES.some((p) => p.key === location.hash.slice(1)) ? location.hash.slice(1) : "home");

export default function App() {
  const [active, setActive] = useState(fromHash);
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme("light");

  useEffect(() => {
    const onHash = () => setActive(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (key) => {
    location.hash = key;
    setActive(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { Page } = PAGES.find((p) => p.key === active);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: true } }}
      padding="md"
    >
      <AppShell.Header withBorder={false} style={{ background: "transparent", backdropFilter: "blur(12px)" }}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fz={28} lh={1}>🏡</Text>
            <div>
              <Text fw={800} fz="lg" lh={1.1}>HomeCtl</Text>
              <Text c="dimmed" fz={11} lh={1}>nossa casa em ordem</Text>
            </div>
          </Group>
          <Tooltip label={scheme === "dark" ? "Modo claro" : "Modo escuro"}>
            <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setColorScheme(scheme === "dark" ? "light" : "dark")} aria-label="Alternar tema">
              {scheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" withBorder={false} style={{ background: "transparent" }}>
        <Stack gap={4}>
          {PAGES.map(({ key, label, icon: Icon, color }) => (
            <NavLink
              key={key}
              active={active === key}
              label={<Text fw={600}>{label}</Text>}
              onClick={() => go(key)}
              color={color}
              variant="light"
              style={{ borderRadius: 14 }}
              leftSection={
                <ThemeIcon variant={active === key ? "filled" : "light"} color={color} radius="md" size={32}>
                  <Icon size={18} />
                </ThemeIcon>
              }
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main pb={{ base: 110, sm: "xl" }} maw={1200}>
        <Page key={active} go={go} />
      </AppShell.Main>

      {/* Abas fixas no rodapé, só no celular */}
      <nav className="bottom-nav">
        {PAGES.map(({ key, label, icon: Icon }) => (
          <button key={key} data-active={active === key} onClick={() => go(key)}>
            <Icon size={22} stroke={1.8} />
            {label}
          </button>
        ))}
      </nav>
    </AppShell>
  );
}
