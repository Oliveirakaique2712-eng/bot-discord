const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.MEU_TOKEN;

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS  = '1497679326383181955';
const CATEGORIA_FECHADOS = '1497679375540289596'; // 👈 troque pelo ID real
const CANAL_LOGS         = '1497679375540289596';
const CANAL_PAINEL       = '1498318862050001056';
const CARGO_STAFF        = '1497002956824907916';

// ── READY ──────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);
  if (!canal) return console.error('Canal painel não encontrado!');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug',         value: 'bug'         },
      { label: '💰 Compra',      value: 'compra'      },
      { label: '❓ Ajuda',       value: 'ajuda'       },
      { label: '🎬 Audiovisual', value: 'audiovisual' },
      { label: '🎨 Design',      value: 'design'      }
    ]);

  await canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [new ActionRowBuilder().addComponents(menu)]
  });
});

// ── HELPERS ────────────────────────────────────────────────────────────────
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

// ── INTERAÇÕES ─────────────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
    const tipo     = interaction.values[0];
    const ticketID = Math.floor(1000 + Math.random() * 9000);

    const canal = await interaction.guild.channels.create({
      name: `ticket-${tipo}-${ticketID}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny:  [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id,  allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: CARGO_STAFF,          allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustom
