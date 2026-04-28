const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const transcripts = require('discord-html-transcripts'); 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.MEU_TOKEN;
const CLIENT_ID = process.env.MEU_CLIENT; // ID do bot
const GUILD_ID = process.env.MEU_GUILD;   // ID do servidor

const commands = [
  new SlashCommandBuilder()
    .setName('embed1')
    .setDescription('Cria um embed simples')
    .addStringOption(opt =>
      opt.setName('titulo').setDescription('Título do embed').setRequired(true))
    .addStringOption(opt =>
      opt.setName('descricao').setDescription('Descrição do embed').setRequired(true))
    .addStringOption(opt =>
      opt.setName('imagem').setDescription('URL da imagem').setRequired(false))
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Canal destino').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Comando /embed1 registrado');
  } catch (err) {
    console.error(err);
  }
})();


// 🔧 CONFIGURAÇÃO
const CATEGORIA_ABERTOS = '1497679326383181955';
const CANAL_LOGS = '1498344306153361528';
const CANAL_PAINEL = '1498318862050001056';
const CARGO_STAFF = '1497002956824907916'; // 👈 MUITO IMPORTANTE
const CANAL_PAINEL_EMBED = '1498466480507846827';

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
   
// FUNÇÃO: verificar se é staff
function isStaff(member) {
  return member.roles.cache.has(CARGO_STAFF);
}

// 🔧 TODAS AS INTERAÇÕES (slash + painel + botões)
client.on('interactionCreate', async (interaction) => {
  // Slash command /embed1
  if (interaction.isChatInputCommand() && interaction.commandName === 'embed1') {
    const titulo = interaction.options.getString('titulo');
    const descricao = interaction.options.getString('descricao');
    const imagem = interaction.options.getString('imagem');
    const canal = interaction.options.getChannel('canal');

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descricao)
      .setColor(0x00AE86);

    if (imagem) embed.setImage(imagem);

    if (!canal || canal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Canal inválido.', ephemeral: true });
    }

    await canal.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed enviado!', ephemeral: true });
  }
});


  // MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {

    const tipo = interaction.values[0];
    
    const ticketID = Math.floor(1000 + Math.random() * 9000);
    
    const canal = await
      interaction.guild.channels.create({
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
  try {

    if (!isStaff(interaction.member))
      return interaction.reply({ content: '❌ Apenas staff', ephemeral: true });

    await interaction.reply('📄 Gerando histórico...');

    const messages = await interaction.channel.messages.fetch({ limit: 100 });

    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let log = `📄 TRANSCRIPT DO TICKET\n\n`;

    sorted.forEach(msg => {
      const time = new Date(msg.createdTimestamp).toLocaleString();
      log += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
    });

    const buffer = Buffer.from(log, 'utf-8');

    const donoId = interaction.channel.topic;

    // 🔥 CANAL DE LOG (OBRIGATÓRIO PRA FUNCIONAR)
    const logChannel = interaction.guild.channels.cache.get(CANAL_LOGS);

    if (logChannel) {
      await logChannel.send({
        content: `📄 Ticket de <@${donoId}>`,
        files: [{
          attachment: buffer,
          name: `ticket-${interaction.channel.name}.txt`
        }]
      });
    } else {
      console.log('Canal de log não encontrado');
    }

    // DM (opcional)
    try {
      const user = await client.users.fetch(donoId);

      await user.send({
        content: '📄 Aqui está o histórico do seu ticket:',
        files: [{
          attachment: buffer,
          name: `ticket-${interaction.channel.name}.txt`
        }]
      });

    } catch (e) {
      console.log('Erro DM:', e.message);
    }

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000);

  } catch (err) {
    console.log('ERRO GERAL:', err);
    interaction.reply({ content: '❌ Deu erro ao fechar o ticket', ephemeral: true });
  }
}
    // 📢 CHAMAR (SÓ STAFF)
    if (interaction.customId === 'chamar_usuario') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      const donoId = interaction.channel.topic;

      try {
        const user = await client.users.fetch(donoId);
        await user.send('📢 Você foi chamado no seu ticket!');
        interaction.reply('Mensagem enviada!');
      } catch {
        interaction.reply('Não consegui enviar DM.');
      }
    }

    // ✏️ RENOMEAR (SÓ STAFF)
    if (interaction.customId === 'renomear_ticket') {
      if (!isStaff(interaction.member))
        return interaction.reply({ content: '❌ Apenas a equipe pode fazer isso.', ephemeral: true });

      return interaction.reply({
        content: 'Use: `!renomear novo-nome`',
        ephemeral: true
      });
    }
  }
});

// COMANDOS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ADD MEMBRO
  if (message.content.startsWith('!add')) {
    if (!isStaff(message.member)) return;

    const membro = message.mentions.members.first();
    if (!membro) return message.reply('Marca alguém.');

    await message.channel.permissionOverwrites.edit(membro.id, {
      ViewChannel: true
    });

    message.reply('Membro adicionado!');
  }

  // RENOMEAR
  if (message.content.startsWith('!renomear')) {
    if (!isStaff(message.member)) return;

    const novoNome = message.content.split(' ').slice(1).join('-');
    if (!novoNome) return message.reply('Coloque um nome.');

    await message.channel.setName(`ticket-${novoNome}`);
    message.reply('Nome alterado!');
  }
});

client.login(TOKEN);
