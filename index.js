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

const transcripts = require('discord-html-transcripts'); 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.MEU_TOKEN;

// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS = '1497679326383181955';
const CATEGORIA_FECHADOS = '1497679375540289596';
const CANAL_PAINEL = '1497716662214856734';
const CARGO_STAFF = '1497002956824907916'; // 👈 MUITO IMPORTANTE

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const canal = client.channels.cache.get(CANAL_PAINEL);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('menu_ticket')
    .setPlaceholder('Escolha o tipo de ticket')
    .addOptions([
      { label: '🐛 Bug', value: 'bug' },
      { label: '💰 Compra', value: 'compra' },
      { label: '❓ Ajuda', value: 'ajuda' },
      { label: '🎬 Audiovisual', value: 'audiovisual' },
      { label: '🎨 Design', value: 'design' }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  canal.send({
    content: '🎫 Selecione o tipo de atendimento:',
    components: [row]
  });
});

// FUNÇÃO: verificar se é staff
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

client.on('interactionCreate', async (interaction) => {

  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {

    const tipo = interaction.values[0];
    
    const ticketID = Math.floor(1000 + Math.random() * 9000);
    
    const canal = await interaction.guild.channels.create({
      name: `ticket-${tipo}-${ticketID}`,
      type: ChannelType.GuildText,
      parent: CATEGORIA_ABERTOS,
      topic: interaction.user.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: CARGO_STAFF,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const botoes = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('🔒 Finalizar')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('chamar_usuario')
        .setLabel('📢 Chamar')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('renomear_ticket')
        .setLabel('✏️ Renomear')
        .setStyle(ButtonStyle.Secondary)
    );

    canal.send({
      content: `🎫 Ticket de <@${interaction.user.id}> | Tipo: **${tipo}**`,
      components: [botoes]
    });

    interaction.reply({ content: '✅ Ticket criado!', ephemeral: true });
  }

  // BOTÕES
  if (interaction.isButton()) {

    // 🔒 FECHAR (SÓ STAFF)
    if (interaction.customId === 'fechar_ticket') {

  if (!isStaff(interaction.member))
    return interaction.reply({ content: '❌ Apenas staff', ephemeral: true });

  await interaction.reply('📄 Gerando histórico...');

  // CRIA TRANSCRIPT
  const attachment = await transcripts.createTranscript(interaction.channel);

  const donoId = interaction.channel.topic;

  // ENVIA NO PRIVADO
  try {
    const user = await client.users.fetch(donoId);
    await user.send({
      content: '📄 Aqui está o histórico do seu ticket:',
      files: [attachment]
    });
  } catch (e) {
    console.log('Erro ao enviar DM');
  }

  // ENVIA NO PRÓPRIO CANAL (staff vê)
  await interaction.channel.send({
    content: '📄 Transcript do ticket:',
    files: [attachment]
  });

  // DELETA O CANAL (não acumula)
  setTimeout(() => {
    interaction.channel.delete();
  }, 5000);
}
