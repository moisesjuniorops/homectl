import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Group, Paper, RingProgress, SimpleGrid, Stack, Text, ThemeIcon, Title, UnstyledButton } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconAlertTriangle, IconBasket, IconCalendarDue, IconChecklist, IconClockHour4, IconPackage, IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import dayjs from "dayjs";
import { api, brl, daysUntil, fmtDate, notifyError } from "../api.js";
import { LoadingList } from "../components/ui.jsx";

const PALETTE = ["teal.6", "orange.6", "violet.6", "cyan.6", "pink.6", "yellow.6", "indigo.6", "lime.6"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function QuickStat({ icon: Icon, color, label, value, onClick }) {
  return (
    <UnstyledButton onClick={onClick}>
      <Card className="lift" p="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={44} radius="lg" variant="light" color={color}><Icon size={24} /></ThemeIcon>
          <div>
            <Text fz={26} fw={800} lh={1}>{value}</Text>
            <Text c="dimmed" fz="xs" fw={600}>{label}</Text>
          </div>
        </Group>
      </Card>
    </UnstyledButton>
  );
}

export default function Dashboard({ go }) {
  const [s, setS] = useState(null);
  const [tx, setTx] = useState([]);

  useEffect(() => {
    Promise.all([api.summary(), api.list("transactions")])
      .then(([sum, t]) => { setS(sum); setTx(t); })
      .catch(notifyError);
  }, []);

  const byCategory = useMemo(() => {
    const start = dayjs().startOf("month");
    const acc = {};
    tx.filter((t) => t.kind === "expense" && !dayjs(t.date).isBefore(start)).forEach((t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  }, [tx]);

  if (!s) return <LoadingList n={5} h={110} />;

  const { income, expense, balance } = s.month;
  const spentPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : expense > 0 ? 100 : 0;

  return (
    <Stack gap="lg">
      <Card className="hero" p="xl">
        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
          <div>
            <Text fz="sm" opacity={0.85}>{(() => { const t = dayjs().format("dddd, D [de] MMMM"); return t[0].toUpperCase() + t.slice(1); })()}</Text>
            <Title order={1} c="white" fz={{ base: 28, sm: 34 }}>{greeting()}! 👋</Title>
            <Text opacity={0.9} mt={4}>Saldo do mês</Text>
            <Text fz={{ base: 32, sm: 40 }} fw={800} lh={1.1}>{brl(balance)}</Text>
            <Group gap="lg" mt="sm">
              <Group gap={6}><IconTrendingUp size={18} /><Text fw={600}>{brl(income)}</Text></Group>
              <Group gap={6}><IconTrendingDown size={18} /><Text fw={600}>{brl(expense)}</Text></Group>
            </Group>
          </div>
          <RingProgress
            size={130}
            thickness={12}
            roundCaps
            sections={[{ value: spentPct, color: spentPct > 85 ? "red.4" : "yellow.3" }]}
            rootColor="rgba(255,255,255,0.25)"
            label={<Stack gap={0} align="center"><Text c="white" fw={800} fz="xl">{spentPct}%</Text><Text c="white" fz={10} opacity={0.85}>da renda gasta</Text></Stack>}
          />
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <QuickStat icon={IconBasket} color="orange" label="para comprar" value={s.shopping_pending} onClick={() => go("shopping")} />
        <QuickStat icon={IconChecklist} color="violet" label="tarefas abertas" value={s.open_tasks} onClick={() => go("tasks")} />
        <QuickStat icon={IconCalendarDue} color="red" label="contas na semana" value={s.bills_due.length} onClick={() => go("bills")} />
        <QuickStat icon={IconPackage} color="cyan" label="estoque baixo" value={s.low_stock.length} onClick={() => go("inventory")} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card p="lg">
          <Text fw={800} mb="md">Gastos do mês por categoria</Text>
          {byCategory.length === 0 ? (
            <Text c="dimmed" size="sm">Nenhuma despesa lançada este mês. 🎉</Text>
          ) : (
            <Group wrap="nowrap" align="center">
              <DonutChart data={byCategory} size={150} thickness={22} withTooltip valueFormatter={brl} paddingAngle={2} />
              <Stack gap={6} style={{ flex: 1 }}>
                {byCategory.slice(0, 5).map((c) => (
                  <Group key={c.name} justify="space-between" wrap="nowrap">
                    <Group gap={6} wrap="nowrap">
                      <div style={{ width: 10, height: 10, borderRadius: 4, background: `var(--mantine-color-${c.color.replace(".", "-")})` }} />
                      <Text size="sm" truncate>{c.name}</Text>
                    </Group>
                    <Text size="sm" fw={700}>{brl(c.value)}</Text>
                  </Group>
                ))}
              </Stack>
            </Group>
          )}
        </Card>

        <Card p="lg">
          <Text fw={800} mb="md">Atenção 👀</Text>
          <Stack gap="xs">
            {s.bills_due.length + s.low_stock.length + s.expiring.length === 0 && (
              <Text c="dimmed" size="sm">Tudo tranquilo por aqui.</Text>
            )}
            {s.bills_due.map((b) => {
              const d = daysUntil(b.due_date);
              return (
                <Paper key={`b${b.id}`} p="sm" radius="lg" bg="var(--mantine-color-red-light)">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap"><IconReceiptIcon /><Text size="sm" fw={600} truncate>{b.name}</Text></Group>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" fw={700}>{brl(b.amount)}</Text>
                      <Badge color={d < 0 ? "red" : "orange"} variant="filled" size="sm">{d < 0 ? "vencida" : d === 0 ? "hoje" : `${d}d`}</Badge>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
            {s.low_stock.map((i) => (
              <Paper key={`l${i.id}`} p="sm" radius="lg" bg="var(--mantine-color-cyan-light)">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap"><IconAlertTriangle size={16} /><Text size="sm" fw={600}>{i.name}</Text></Group>
                  <Text size="sm">{i.quantity}/{i.min_quantity} {i.unit}</Text>
                </Group>
              </Paper>
            ))}
            {s.expiring.map((i) => (
              <Paper key={`e${i.id}`} p="sm" radius="lg" bg="var(--mantine-color-yellow-light)">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap"><IconClockHour4 size={16} /><Text size="sm" fw={600}>{i.name}</Text></Group>
                  <Text size="sm">vence {fmtDate(i.expires_on)}</Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

const IconReceiptIcon = () => <IconCalendarDue size={16} />;
