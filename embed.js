const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = process.env.MEU_TOKEN;
const CLIENT_ID = '1492561896946143363';

 Registrar o comando embed
const rest = new REST({ version '10' }).setToken(TOKEN);
(async () = {
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body [
      new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Criar um embed personalizado')
        .toJSON()
    ]}
  );
})();

client.once('ready', () = {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) = {
   Slash command embed
  if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
    const modal = new ModalBuilder()
      .setCustomId('embed_modal')
      .setTitle('Criar Embed');

    const titulo = new TextInputBuilder()
      .setCustomId('titulo')
      .setLabel('Título')
      .setStyle(TextInputStyle.Short);

    const descricao = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição')
      .setStyle(TextInputStyle.Paragraph);

    const imagem = new TextInputBuilder()
      .setCustomId('imagem')
      .setLabel('URL da imagem (opcional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const canalId = new TextInputBuilder()
      .setCustomId('canal')
      .setLabel('ID do canal destino')
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titulo),
      new ActionRowBuilder().addComponents(descricao),
      new ActionRowBuilder().addComponents(imagem),
      new ActionRowBuilder().addComponents(canalId)
    );

    await interaction.showModal(modal);
  }

   Modal enviado
  if (interaction.isModalSubmit() && interaction.customId === 'embed_modal') {
    const titulo    = interaction.fields.getTextInputValue('titulo');
    const descricao = interaction.fields.getTextInputValue('descricao');
    const imagem    = interaction.fields.getTextInputValue('imagem');
    const canalId   = interaction.fields.getTextInputValue('canal');

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descricao)
      .setColor(0x00AE86);

    if (imagem) embed.setImage(imagem);

    const canal = interaction.guild.channels.cache.get(canalId);
    if (!canal  canal.type !== ChannelType.GuildText) {
      return interaction.reply({ content '❌ Canal inválido.', ephemeral true });
    }

    await canal.send({ embeds [embed] });
    await interaction.reply({ content '✅ Embed enviado!', ephemeral true });
  }
});

client.login(TOKEN);
