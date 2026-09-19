using PortfolioManagement.Domain.Securities;

namespace PortfolioManagement.Tests.Securities;

public sealed class IsinTests
{
    [Theory]
    [InlineData("US0378331005")]  // Apple
    [InlineData("FR0000120271")]  // TotalEnergies
    [InlineData("IE00B4L5Y983")]  // iShares Core MSCI World
    [InlineData("GB0002634946")]  // BAE Systems
    public void Accepte_un_isin_reel(string isin) => Assert.True(Isin.IsValid(isin));

    [Theory]
    [InlineData("US0378331004")]      // clé fausse d'un cran
    [InlineData("FR000012027")]       // trop court
    [InlineData("FR00001202711")]     // trop long
    [InlineData("1R0000120271")]      // pays non alphabétique
    [InlineData("FR000012027A")]      // clé non numérique
    [InlineData("XX0000000000")]      // remplissage arithmétiquement juste, mais vide de sens
    [InlineData("")]
    [InlineData(null)]
    public void Refuse_ce_qui_n_est_pas_un_isin(string? isin) => Assert.False(Isin.IsValid(isin));
}
