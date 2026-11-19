import { useState } from "react";
import {
  ActionIcon, Button, Center, Group, Modal, NativeSelect, NumberInput, Select, Skeleton, Stack,
  Switch, Text, TextInput, ThemeIcon, Title,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";

export function PageHeader({ icon: Icon, color = "teal", title, subtitle, action }) {
  return (
    <Group justify="space-between" mb="lg" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={46} radius="lg" variant="light" color={color}>
          <Icon size={26} stroke={1.8} />
        </ThemeIcon>
        <div>
          <Title order={2} lh={1.1}>{title}</Title>
          {subtitle && <Text c="dimmed" size="sm">{subtitle}</Text>}
        </div>
      </Group>
      {action}
    </Group>
  );
}

export function EmptyState({ emoji, title, text }) {
  return (
    <Center py={60}>
      <Stack align="center" gap={4}>
        <Text fz={56} lh={1}>{emoji}</Text>
        <Text fw={700} fz="lg">{title}</Text>
        <Text c="dimmed" size="sm" ta="center" maw={280}>{text}</Text>
      </Stack>
    </Center>
  );
}

export function LoadingList({ n = 4, h = 72 }) {
  return (
    <Stack>
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} h={h} radius="xl" />)}
    </Stack>
  );
}

export const confirmDelete = (label, onConfirm) =>
  modals.openConfirmModal({
    title: "Excluir?",
    children: <Text size="sm">“{label}” será removido.</Text>,
    labels: { confirm: "Excluir", cancel: "Cancelar" },
    confirmProps: { color: "red" },
    onConfirm,
  });

/**
 * Botão "Adicionar" + modal com formulário.
 * fields: [{ name, label, type: text|number|date|select|switch, data, required, default, placeholder, prefix }]
 */
export function AddButton({ title, fields, onSubmit, color = "teal", label = "Adicionar" }) {
  const [opened, { open, close }] = useDisclosure(false);
  const mobile = useMediaQuery("(max-width: 48em)");
  const empty = () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? (f.type === "switch" ? false : "")]));
  const [form, setForm] = useState(empty);
  // Lê o valor do evento AGORA: o React zera event.currentTarget depois do handler,
  // e o updater do setState roda depois. Mantine (NumberInput/Select) já passa o valor puro.
  const set = (name) => (v) => {
    const t = v?.currentTarget ?? v?.target;
    const value = t && typeof t === "object" && "value" in t ? (t.type === "checkbox" ? t.checked : t.value) : v;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const out = {};
    for (const f of fields) {
      const v = form[f.name];
      if (v === "" || v === null || v === undefined) continue;
      out[f.name] = f.type === "number" ? Number(v) : v;
    }
    await onSubmit(out);
    setForm(empty());
    close();
  };

  return (
    <>
      <Button leftSection={<IconPlus size={18} />} color={color} onClick={open} visibleFrom="sm">
        {label}
      </Button>
      {mobile && (
        <div className="fab">
          <ActionIcon size={58} radius="xl" color={color} onClick={open} variant="filled" style={{ boxShadow: "var(--mantine-shadow-lg)" }}>
            <IconPlus size={28} />
          </ActionIcon>
        </div>
      )}
      <Modal opened={opened} onClose={close} title={<Text fw={800} fz="lg">{title}</Text>} fullScreen={mobile} transitionProps={{ transition: mobile ? "slide-up" : "pop" }}>
        <form onSubmit={submit}>
          <Stack>
            {fields.map((f) => {
              const common = { key: f.name, label: f.label, required: f.required, placeholder: f.placeholder };
              if (f.type === "number")
                return <NumberInput {...common} value={form[f.name]} onChange={set(f.name)} min={0} decimalSeparator="," thousandSeparator="." prefix={f.prefix} decimalScale={2} />;
              // No celular usa o seletor nativo do sistema: o dropdown do Mantine dentro do
              // modal em tela cheia faz o modal "pular" quando abre.
              if (f.type === "select")
                return mobile ? (
                  <NativeSelect {...common} data={f.data} value={form[f.name]} onChange={set(f.name)} />
                ) : (
                  <Select {...common} data={f.data} value={form[f.name]} onChange={set(f.name)} allowDeselect={false} comboboxProps={{ withinPortal: true, zIndex: 1000, position: "bottom", middlewares: { flip: false, shift: true } }} maxDropdownHeight={220} />
                );
              if (f.type === "switch")
                return <Switch key={f.name} label={f.label} checked={form[f.name]} onChange={set(f.name)} />;
              // Data: no desktop, DateInput sempre em DD/MM/AAAA (o <input type="date"> segue o idioma
              // do navegador e, em inglês, vira MM/DD — 11/02 era lido como 2 de fevereiro).
              // No celular fica o seletor nativo do sistema.
              if (f.type === "date" && !mobile)
                return (
                  <DateInput {...common} value={form[f.name] || null} onChange={(v) => set(f.name)(v || "")}
                    valueFormat="DD/MM/YYYY" locale="pt-br" clearable popoverProps={{ withinPortal: true, zIndex: 1000 }} />
                );
              return <TextInput {...common} type={f.type || "text"} value={form[f.name]} onChange={set(f.name)} />;
            })}
            <Button type="submit" size="md" color={color} mt="sm">Salvar</Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
